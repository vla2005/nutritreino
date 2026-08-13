import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../composables/useAuth.js'
import { useToast } from '../composables/useToast.jsx'
import { getEcho } from '../services/echo.js'
import { sendCallSignal } from '../services/calls.js'
import { normalizeAvatarUrl } from '../utils/avatar.js'

const VideoCallContext = createContext(null)
const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
const CALL_RING_TIMEOUT_MS = 45000
const callMediaConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
}

export function VideoCallProvider({ children }) {
  const { user } = useAuth()
  const toast = useToast()
  const [call, setCall] = useState(null)
  const [incoming, setIncoming] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [localPreviewStream, setLocalPreviewStream] = useState(null)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [screenSharing, setScreenSharing] = useState(false)
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false)

  const callRef = useRef(null)
  const incomingRef = useRef(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const screenAudioSenderRef = useRef(null)
  const pendingIceRef = useRef([])
  const endingRef = useRef(false)
  const ringTimeoutRef = useRef(null)

  useEffect(() => {
    callRef.current = call
  }, [call])

  useEffect(() => {
    incomingRef.current = incoming
  }, [incoming])

  const signal = useCallback(async (type, payload = {}, targetCall = callRef.current) => {
    if (!targetCall?.conversationUuid || !targetCall?.id) return
    await sendCallSignal(targetCall.conversationUuid, {
      callId: targetCall.id,
      type,
      payload,
    })
  }, [])

  const clearRingTimeout = useCallback(() => {
    if (ringTimeoutRef.current) {
      window.clearTimeout(ringTimeoutRef.current)
      ringTimeoutRef.current = null
    }
  }, [])

  const cleanup = useCallback((notifyPeer = false, nextStatus = 'ended') => {
    const activeCall = callRef.current
    clearRingTimeout()

    if (notifyPeer && activeCall && !endingRef.current) {
      endingRef.current = true
      signal('ended').catch(() => {})
    }

    pcRef.current?.close()
    pcRef.current = null
    screenAudioSenderRef.current = null
    pendingIceRef.current = []

    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    screenStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
    screenStreamRef.current = null

    setRemoteStream(null)
    setLocalPreviewStream(null)
    setScreenSharing(false)
    setRemoteScreenSharing(false)
    setMicEnabled(true)
    setCameraEnabled(true)
    const settledCall = activeCall ? { ...activeCall, status: nextStatus } : null
    callRef.current = settledCall
    setIncoming(null)
    setCall(settledCall)

    window.setTimeout(() => {
      if (callRef.current?.status === nextStatus) {
        callRef.current = null
        setCall(null)
      }
      endingRef.current = false
    }, 900)
  }, [clearRingTimeout, signal])

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Seu navegador nao permite chamadas de video neste dispositivo.')
    }

    let stream = null

    try {
      stream = await navigator.mediaDevices.getUserMedia(callMediaConstraints)
    } catch (error) {
      if (!canFallbackToAudioOnly(error)) throw error

      stream = await navigator.mediaDevices.getUserMedia({ audio: callMediaConstraints.audio, video: false })
      toast.info('Nao foi possivel iniciar a camera. Voce entrou apenas com audio.')
    }

    localStreamRef.current = stream
    setLocalPreviewStream(stream)
    setMicEnabled(stream.getAudioTracks().some((track) => track.enabled))
    setCameraEnabled(stream.getVideoTracks().some((track) => track.enabled))
    return stream
  }, [toast])

  const ensurePeerConnection = useCallback(async () => {
    if (pcRef.current) return pcRef.current

    const pc = new RTCPeerConnection(rtcConfig)
    pcRef.current = pc

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signal('ice-candidate', { candidate: event.candidate.toJSON() }).catch(() => {})
      }
    }

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0])
    }

    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        cleanup(false, 'ended')
      }
    }

    const stream = await ensureLocalStream()
    stream.getTracks().forEach((track) => pc.addTrack(track, stream))

    return pc
  }, [cleanup, ensureLocalStream, signal])

  const flushPendingIce = useCallback(async () => {
    const pc = pcRef.current
    if (!pc?.remoteDescription) return

    const candidates = pendingIceRef.current.splice(0)
    await Promise.all(candidates.map((candidate) => pc.addIceCandidate(candidate).catch(() => {})))
  }, [])

  const startCall = useCallback(async (conversation) => {
    if (!conversation?.uuid || !conversation?.participant) return
    if (callRef.current || incoming) {
      toast.info('Voce ja esta em uma chamada.')
      return
    }

    const nextCall = {
      id: crypto.randomUUID(),
      conversationUuid: conversation.uuid,
      participant: conversation.participant,
      direction: 'outgoing',
      status: 'ringing',
    }

    try {
      callRef.current = nextCall
      setCall(nextCall)
      await sendCallSignal(conversation.uuid, {
        callId: nextCall.id,
        type: 'invite',
      })
      clearRingTimeout()
      ringTimeoutRef.current = window.setTimeout(() => {
        const activeCall = callRef.current
        if (!activeCall || activeCall.id !== nextCall.id || activeCall.status !== 'ringing') return

        sendCallSignal(activeCall.conversationUuid, {
          callId: activeCall.id,
          type: 'rejected',
          payload: { reason: 'no-answer' },
        }).catch(() => {})

        cleanup(false, 'missed')
      }, CALL_RING_TIMEOUT_MS)
    } catch (err) {
      clearRingTimeout()
      callRef.current = null
      setCall(null)
      toast.warning(err.message)
    }
  }, [clearRingTimeout, cleanup, incoming, toast])

  const acceptIncoming = useCallback(async () => {
    if (!incoming) return

    try {
      await ensureLocalStream()
      const nextCall = { ...incoming, direction: 'incoming', status: 'connecting' }
      callRef.current = nextCall
      setCall(nextCall)
      setIncoming(null)
      await signal('accepted', {}, incoming)
    } catch (err) {
      toast.warning(mediaErrorMessage(err))
      await signal('rejected', { reason: 'media-denied' }, incoming).catch(() => {})
      cleanup(false)
    }
  }, [cleanup, ensureLocalStream, incoming, signal, toast])

  const rejectIncoming = useCallback(async () => {
    if (!incoming) return
    await signal('rejected', {}, incoming).catch(() => {})
    setIncoming(null)
  }, [incoming, signal])

  const createOffer = useCallback(async () => {
    const pc = await ensurePeerConnection()
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await signal('offer', { description: encodeSessionDescription(pc.localDescription) })
    setCall((current) => current ? { ...current, status: 'active' } : current)
  }, [ensurePeerConnection, signal])

  const handleOffer = useCallback(async (payload) => {
    const pc = await ensurePeerConnection()
    await pc.setRemoteDescription(decodeSessionDescription(payload))
    await flushPendingIce()
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await signal('answer', { description: encodeSessionDescription(pc.localDescription) })
    setCall((current) => current ? { ...current, status: 'active' } : current)
  }, [ensurePeerConnection, flushPendingIce, signal])

  const handleAnswer = useCallback(async (payload) => {
    const pc = pcRef.current
    if (!pc) return
    await pc.setRemoteDescription(decodeSessionDescription(payload))
    await flushPendingIce()
    setCall((current) => current ? { ...current, status: 'active' } : current)
  }, [flushPendingIce])

  const handleIceCandidate = useCallback(async (payload) => {
    if (!payload?.candidate) return
    const candidate = new RTCIceCandidate(payload.candidate)
    const pc = pcRef.current

    if (!pc?.remoteDescription) {
      pendingIceRef.current.push(candidate)
      return
    }

    await pc.addIceCandidate(candidate).catch(() => {})
  }, [])

  useEffect(() => {
    if (!user?.uuid) return undefined

    const channel = getEcho().private(`users.${user.uuid}`)

    channel.listen('.call.signal', async (event) => {
      const eventCall = {
        id: event.call_id,
        conversationUuid: event.conversation_uuid,
        participant: event.from,
      }

      try {
        if (event.type === 'invite') {
          if (callRef.current?.id === event.call_id || incomingRef.current?.id === event.call_id) {
            return
          }

          if (callRef.current || incomingRef.current) {
            await sendCallSignal(event.conversation_uuid, {
              callId: event.call_id,
              type: 'rejected',
              payload: { reason: 'busy' },
            }).catch(() => {})
            return
          }

          setIncoming({ ...eventCall, status: 'ringing' })
          return
        }

        if (event.type === 'rejected' && incomingRef.current?.id === event.call_id) {
          setIncoming(null)
          if (event.payload?.reason === 'no-answer') {
            toast.info('Chamada perdida.')
          }
          return
        }

        if (callRef.current?.id !== event.call_id) return

        if (event.type === 'accepted') {
          clearRingTimeout()
          setCall((current) => current ? { ...current, status: 'connecting' } : current)
          await createOffer()
          return
        }

        if (event.type === 'rejected') {
          clearRingTimeout()
          const reason = event.payload?.reason
          toast.info(reason === 'busy' ? 'A pessoa esta em outra chamada.' : reason === 'no-answer' ? 'Chamada perdida.' : 'Chamada recusada.')
          cleanup(false, reason === 'no-answer' ? 'missed' : 'rejected')
          return
        }

        if (event.type === 'offer') {
          await handleOffer(event.payload)
          return
        }

        if (event.type === 'answer') {
          await handleAnswer(event.payload)
          return
        }

        if (event.type === 'ice-candidate') {
          await handleIceCandidate(event.payload)
          return
        }

        if (event.type === 'screen-started') {
          setRemoteScreenSharing(true)
          return
        }

        if (event.type === 'screen-stopped') {
          setRemoteScreenSharing(false)
          return
        }

        if (event.type === 'ended') {
          cleanup(false, 'ended')
        }
      } catch (err) {
        toast.warning(err.message || 'A chamada foi interrompida.')
        cleanup(true, 'ended')
      }
    })

    return () => {
      getEcho().leave(`users.${user.uuid}`)
    }
  }, [cleanup, createOffer, handleAnswer, handleIceCandidate, handleOffer, toast, user?.uuid])

  useEffect(() => {
    function handleStart(event) {
      startCall(event.detail?.conversation)
    }

    window.addEventListener('video-call:start', handleStart)
    return () => window.removeEventListener('video-call:start', handleStart)
  }, [startCall])

  useEffect(() => () => clearRingTimeout(), [clearRingTimeout])

  useEffect(() => {
    function handleBeforeUnload() {
      if (callRef.current) signal('ended').catch(() => {})
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [signal])

  const toggleMic = useCallback(() => {
    const enabled = !micEnabled
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled
    })
    setMicEnabled(enabled)
  }, [micEnabled])

  const toggleCamera = useCallback(() => {
    const enabled = !cameraEnabled
    const videoTracks = localStreamRef.current?.getVideoTracks() || []

    if (enabled && !videoTracks.length) {
      navigator.mediaDevices?.getUserMedia({ video: callMediaConstraints.video })
        .then(async (stream) => {
          const cameraTrack = stream.getVideoTracks()[0]
          const sender = pcRef.current?.getSenders().find((item) => item.track?.kind === 'video')

          if (localStreamRef.current && cameraTrack) {
            localStreamRef.current.addTrack(cameraTrack)
            setLocalPreviewStream(localStreamRef.current)
          }

          if (sender && cameraTrack) {
            await sender.replaceTrack(cameraTrack)
          } else if (pcRef.current && localStreamRef.current && cameraTrack) {
            pcRef.current.addTrack(cameraTrack, localStreamRef.current)
          }

          setCameraEnabled(Boolean(cameraTrack))
        })
        .catch((error) => {
          toast.warning(mediaErrorMessage(error))
          setCameraEnabled(false)
        })
      return
    }

    videoTracks.forEach((track) => {
      track.enabled = enabled
    })
    setCameraEnabled(enabled)
  }, [cameraEnabled, toast])

  const stopScreenShare = useCallback(async () => {
    if (!screenStreamRef.current) return

    const cameraTrack = localStreamRef.current?.getVideoTracks()[0]
    const sender = pcRef.current?.getSenders().find((item) => item.track?.kind === 'video')
    const screenStream = screenStreamRef.current
    screenStreamRef.current = null

    if (sender && cameraTrack) await sender.replaceTrack(cameraTrack)
    if (screenAudioSenderRef.current && pcRef.current) {
      pcRef.current.removeTrack(screenAudioSenderRef.current)
      screenAudioSenderRef.current = null
    }
    screenStream.getTracks().forEach((track) => {
      track.onended = null
      track.stop()
    })
    setLocalPreviewStream(localStreamRef.current)
    setScreenSharing(false)
    await signal('screen-stopped').catch(() => {})
  }, [signal])

  const startScreenShare = useCallback(async () => {
    if (remoteScreenSharing) {
      toast.info('A outra pessoa ja esta compartilhando a tela.')
      return
    }

    if (screenSharing) {
      await stopScreenShare()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          suppressLocalAudioPlayback: false,
        },
      })
      const screenTrack = stream.getVideoTracks()[0]
      const screenAudioTrack = stream.getAudioTracks()[0]
      const sender = pcRef.current?.getSenders().find((item) => item.track?.kind === 'video')

      if (sender && screenTrack) await sender.replaceTrack(screenTrack)
      if (pcRef.current && screenAudioTrack) {
        screenAudioSenderRef.current = pcRef.current.addTrack(screenAudioTrack, stream)
      }
      screenStreamRef.current = stream
      setLocalPreviewStream(stream)
      setScreenSharing(true)
      await signal('screen-started')

      screenTrack.onended = () => {
        stopScreenShare().catch(() => {})
      }
    } catch (err) {
      if (err?.name !== 'NotAllowedError') toast.warning('Nao foi possivel compartilhar a tela.')
    }
  }, [remoteScreenSharing, screenSharing, signal, stopScreenShare, toast])

  const value = useMemo(() => ({ startCall }), [startCall])

  return (
    <VideoCallContext.Provider value={value}>
      {children}
      <IncomingCallDialog call={incoming} onAccept={acceptIncoming} onReject={rejectIncoming} />
      <CallWindow
        call={call}
        remoteStream={remoteStream}
        localStream={localPreviewStream}
        micEnabled={micEnabled}
        cameraEnabled={cameraEnabled}
        screenSharing={screenSharing}
        remoteScreenSharing={remoteScreenSharing}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onShareScreen={startScreenShare}
        onEnd={() => cleanup(true, 'ended')}
      />
    </VideoCallContext.Provider>
  )
}

export function useVideoCall() {
  const context = useContext(VideoCallContext)
  if (!context) throw new Error('useVideoCall deve ser usado dentro de VideoCallProvider')
  return context
}

function IncomingCallDialog({ call, onAccept, onReject }) {
  const ringRef = useRef(null)

  useEffect(() => {
    if (!call) return undefined

    ringRef.current = startIncomingRing()

    return () => {
      ringRef.current?.stop()
      ringRef.current = null
    }
  }, [call])

  if (!call) return null

  return (
    <div className="video-call-incoming-backdrop" role="dialog" aria-modal="true" aria-label="Chamada recebida">
      <div className="video-call-incoming">
        <Avatar participant={call.participant} />
        <div>
          <p>Chamada de video</p>
          <strong>{call.participant?.name || 'Contato'}</strong>
        </div>
        <div className="video-call-incoming-actions">
          <button type="button" className="is-decline is-ringing" onClick={onReject} aria-label="Recusar chamada">
            <PhoneOffIcon />
          </button>
          <button type="button" className="is-accept is-ringing" onClick={onAccept} aria-label="Aceitar chamada">
            <PhoneIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

function startIncomingRing() {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return { stop: () => {} }

  let audioContext = null
  let timer = null
  const activeNodes = new Set()
  let stopped = false

  function ringBurst() {
    if (stopped) return

    try {
      audioContext ||= new AudioContext()
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {})

      const now = audioContext.currentTime
      const duration = 1.75
      const master = audioContext.createGain()
      const toneA = audioContext.createOscillator()
      const toneB = audioContext.createOscillator()
      const tremolo = audioContext.createOscillator()
      const tremoloGain = audioContext.createGain()

      toneA.type = 'sine'
      toneB.type = 'sine'
      tremolo.type = 'sine'
      toneA.frequency.setValueAtTime(440, now)
      toneB.frequency.setValueAtTime(480, now)
      tremolo.frequency.setValueAtTime(18, now)

      tremoloGain.gain.setValueAtTime(0.055, now)
      master.gain.setValueAtTime(0.0001, now)
      master.gain.exponentialRampToValueAtTime(0.09, now + 0.08)
      master.gain.setValueAtTime(0.09, now + duration - 0.16)
      master.gain.exponentialRampToValueAtTime(0.0001, now + duration)

      tremolo.connect(tremoloGain)
      tremoloGain.connect(master.gain)
      toneA.connect(master)
      toneB.connect(master)
      master.connect(audioContext.destination)

      activeNodes.add(toneA)
      activeNodes.add(toneB)
      activeNodes.add(tremolo)
      toneA.start(now)
      toneB.start(now)
      tremolo.start(now)
      toneA.stop(now + duration)
      toneB.stop(now + duration)
      tremolo.stop(now + duration)

      const forget = () => {
        activeNodes.delete(toneA)
        activeNodes.delete(toneB)
        activeNodes.delete(tremolo)
      }

      toneA.onended = forget
    } catch {
      stop()
    }
  }

  function stop() {
    stopped = true
    if (timer) window.clearInterval(timer)
    timer = null
    activeNodes.forEach((node) => {
      try {
        node.stop()
      } catch {
        // O toque pode ja ter parado naturalmente.
      }
    })
    activeNodes.clear()
    audioContext?.close?.().catch(() => {})
  }

  ringBurst()
  timer = window.setInterval(ringBurst, 3800)

  return { stop }
}

function CallWindow({ call, remoteStream, localStream, micEnabled, cameraEnabled, screenSharing, remoteScreenSharing, onToggleMic, onToggleCamera, onShareScreen, onEnd }) {
  const windowRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localVideoRef = useRef(null)
  const stageRef = useRef(null)
  const localRef = useRef(null)
  const dragRef = useRef(null)
  const windowDragRef = useRef(null)
  const [maximized, setMaximized] = useState(false)
  const [localPosition, setLocalPosition] = useState(null)
  const [windowPosition, setWindowPosition] = useState(null)
  const [localPreviewHidden, setLocalPreviewHidden] = useState(false)

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
  }, [remoteStream])

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream
  }, [localPreviewHidden, localStream])

  useEffect(() => {
    if (!call) return undefined

    function handleResize() {
      setLocalPosition((current) => clampLocalPosition(current, stageRef.current, localRef.current))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [call])

  useEffect(() => {
    setLocalPosition((current) => clampLocalPosition(current, stageRef.current, localRef.current))
  }, [maximized])

  useEffect(() => {
    if (!call) exitVideoFullscreen().catch(() => {})
    if (!call) setWindowPosition(null)
    if (!call) setLocalPreviewHidden(false)
  }, [call])

  useEffect(() => {
    if (!call || maximized) return undefined

    function handleResize() {
      setWindowPosition((current) => clampWindowPosition(current, windowRef.current))
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [call, maximized])

  useEffect(() => {
    function handleFullscreenChange() {
      if (!hasVideoFullscreen()) {
        setMaximized(false)
        unlockOrientation().catch(() => {})
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [])

  async function toggleMaximized() {
    const nextMaximized = !maximized

    if (isMobileViewport()) {
      if (nextMaximized) {
        if (!windowRef.current) return
        setMaximized(true)

        await requestNativeVideoFullscreen(remoteVideoRef.current)
          .catch(() => requestCallFullscreen(windowRef.current, remoteVideoRef.current))
          .then(() => {
          lockLandscape().catch(() => {})
        }).catch(() => {
          setMaximized(false)
        })
        return
      }

      setMaximized(false)
      await exitVideoFullscreen().catch(() => {})
      await unlockOrientation().catch(() => {})
      return
    }

    setMaximized(nextMaximized)
  }

  function startWindowDrag(event) {
    if (maximized || !windowRef.current || shouldIgnoreWindowDrag(event.target)) return

    event.preventDefault()

    const rect = windowRef.current.getBoundingClientRect()

    windowDragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    }

    setWindowPosition({
      x: rect.left,
      y: rect.top,
    })

    window.addEventListener('pointermove', moveCallWindow)
    window.addEventListener('pointerup', stopWindowDrag, { once: true })
    window.addEventListener('pointercancel', stopWindowDrag, { once: true })
  }

  function moveCallWindow(event) {
    const drag = windowDragRef.current
    const element = windowRef.current
    if (!drag || !element || event.pointerId !== drag.pointerId) return

    setWindowPosition(clampWindowPoint({
      x: event.clientX - drag.offsetX,
      y: event.clientY - drag.offsetY,
    }, element.getBoundingClientRect()))
  }

  function stopWindowDrag() {
    windowDragRef.current = null
    window.removeEventListener('pointermove', moveCallWindow)
    window.removeEventListener('pointerup', stopWindowDrag)
    window.removeEventListener('pointercancel', stopWindowDrag)
  }

  function startLocalDrag(event) {
    if (!stageRef.current || !localRef.current) return
    event.preventDefault()
    event.stopPropagation()

    const stageRect = stageRef.current.getBoundingClientRect()
    const localRect = localRef.current.getBoundingClientRect()

    dragRef.current = {
      offsetX: event.clientX - localRect.left,
      offsetY: event.clientY - localRect.top,
    }

    setLocalPosition({
      x: localRect.left - stageRect.left,
      y: localRect.top - stageRect.top,
    })

    window.addEventListener('pointermove', moveLocalPreview)
    window.addEventListener('pointerup', stopLocalDrag, { once: true })
  }

  function moveLocalPreview(event) {
    const drag = dragRef.current
    const stage = stageRef.current
    const local = localRef.current
    if (!drag || !stage || !local) return

    const stageRect = stage.getBoundingClientRect()
    const localRect = local.getBoundingClientRect()
    setLocalPosition(clampPoint({
      x: event.clientX - stageRect.left - drag.offsetX,
      y: event.clientY - stageRect.top - drag.offsetY,
    }, stageRect, localRect))
  }

  function stopLocalDrag() {
    dragRef.current = null
    window.removeEventListener('pointermove', moveLocalPreview)
  }

  if (!call) return null

  return (
    <section
      ref={windowRef}
      className={`video-call-window ${maximized ? 'is-maximized' : ''} ${windowPosition && !maximized ? 'is-positioned' : ''}`}
      data-screen-sharing={remoteScreenSharing || screenSharing ? 'true' : undefined}
      style={windowPosition && !maximized ? { left: `${windowPosition.x}px`, top: `${windowPosition.y}px` } : undefined}
      onPointerDown={startWindowDrag}
      aria-label="Chamada de video em andamento"
    >
      <div ref={stageRef} className="video-call-stage">
        {remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline webkit-playsinline="true" />
        ) : (
          <div className="video-call-waiting">
            <Avatar participant={call.participant} />
            <strong>{call.participant?.name || 'Contato'}</strong>
            <span>{statusLabel(call.status)}</span>
          </div>
        )}

        {!localPreviewHidden ? (
          <div
            ref={localRef}
            className="video-call-local"
            style={localPosition ? { left: `${localPosition.x}px`, top: `${localPosition.y}px` } : undefined}
            onPointerDown={startLocalDrag}
            role="button"
            tabIndex={0}
            aria-label="Mover sua camera"
          >
            {localStream ? <video ref={localVideoRef} autoPlay muted playsInline /> : <Avatar participant={call.participant} />}
          </div>
        ) : null}

        {remoteScreenSharing ? <span className="video-call-screen-pill">Tela compartilhada</span> : null}
      </div>

      <div className="video-call-footer">
        <div>
          <strong>{call.participant?.name || 'Contato'}</strong>
          <span>{screenSharing ? 'Voce esta compartilhando sua tela' : statusLabel(call.status)}</span>
        </div>
        <div className="video-call-controls">
          <button type="button" onClick={onToggleMic} className={!micEnabled ? 'is-off' : ''} aria-label={micEnabled ? 'Silenciar microfone' : 'Ativar microfone'}>
            {micEnabled ? <MicIcon /> : <MicOffIcon />}
          </button>
          <button type="button" onClick={onToggleCamera} className={!cameraEnabled ? 'is-off' : ''} aria-label={cameraEnabled ? 'Desativar camera' : 'Ativar camera'}>
            {cameraEnabled ? <CameraIcon /> : <CameraOffIcon />}
          </button>
          <button type="button" onClick={onShareScreen} className={screenSharing ? 'is-sharing' : ''} disabled={remoteScreenSharing && !screenSharing} aria-label="Compartilhar tela">
            <ScreenIcon />
          </button>
          <button type="button" onClick={() => setLocalPreviewHidden((current) => !current)} className={localPreviewHidden ? 'is-off' : ''} aria-label={localPreviewHidden ? 'Mostrar sua camera' : 'Ocultar sua camera'}>
            {localPreviewHidden ? <EyeIcon /> : <EyeOffIcon />}
          </button>
          <button type="button" onClick={toggleMaximized} aria-label={maximized ? 'Restaurar chamada' : 'Maximizar chamada'}>
            {maximized ? <MinimizeIcon /> : <MaximizeIcon />}
          </button>
          <button type="button" onClick={onEnd} className="is-end" aria-label="Encerrar chamada">
            <PhoneOffIcon />
          </button>
        </div>
      </div>
    </section>
  )
}

function clampLocalPosition(position, stage, local) {
  if (!position || !stage || !local) return position
  return clampPoint(position, stage.getBoundingClientRect(), local.getBoundingClientRect())
}

function shouldIgnoreWindowDrag(target) {
  return Boolean(target?.closest?.('button, input, textarea, select, a, .video-call-local'))
}

function clampWindowPosition(position, element) {
  if (!position || !element) return position
  return clampWindowPoint(position, element.getBoundingClientRect())
}

function clampWindowPoint(point, rect) {
  const gap = 10
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight
  const maxX = Math.max(gap, viewportWidth - rect.width - gap)
  const maxY = Math.max(gap, viewportHeight - rect.height - gap)

  return {
    x: Math.min(Math.max(point.x, gap), maxX),
    y: Math.min(Math.max(point.y, gap), maxY),
  }
}

function clampPoint(point, stageRect, localRect) {
  const gap = 12
  const maxX = Math.max(gap, stageRect.width - localRect.width - gap)
  const maxY = Math.max(gap, stageRect.height - localRect.height - gap)

  return {
    x: Math.min(Math.max(point.x, gap), maxX),
    y: Math.min(Math.max(point.y, gap), maxY),
  }
}

function isMobileViewport() {
  return window.matchMedia?.('(max-width: 768px)').matches || window.innerWidth <= 768
}

async function requestCallFullscreen(element, fallbackVideo) {
  if (!element) return

  const request = element.requestFullscreen
    || element.webkitRequestFullscreen
    || element.msRequestFullscreen

  if (request && !document.fullscreenElement && !document.webkitFullscreenElement) {
    await request.call(element)
    return
  }

  await requestNativeVideoFullscreen(fallbackVideo)
}

async function requestNativeVideoFullscreen(video) {
  if (!video) throw new Error('Video indisponivel para fullscreen.')

  const previousControls = video.hasAttribute('controls')
  const previousPlaysInline = video.hasAttribute('playsinline')
  const previousWebkitPlaysInline = video.hasAttribute('webkit-playsinline')

  video.setAttribute('controls', 'controls')
  video.removeAttribute('playsinline')
  video.removeAttribute('webkit-playsinline')
  video.playsInline = false

  const enterFullscreen = video.webkitEnterFullscreen || video.webkitRequestFullscreen || video.requestFullscreen

  try {
    if (!enterFullscreen || document.fullscreenElement || document.webkitFullscreenElement) {
      throw new Error('Fullscreen nativo indisponivel.')
    }

    await enterFullscreen.call(video)
  } finally {
    if (!previousControls) {
      window.setTimeout(() => {
        video.removeAttribute('controls')
      }, 600)
    }

    if (previousPlaysInline) {
      video.setAttribute('playsinline', 'true')
      video.playsInline = true
    }

    if (previousWebkitPlaysInline) {
      video.setAttribute('webkit-playsinline', 'true')
    }
  }
}

async function exitVideoFullscreen() {
  const exit = document.exitFullscreen
    || document.webkitExitFullscreen
    || document.msExitFullscreen

  if (exit && (document.fullscreenElement || document.webkitFullscreenElement)) {
    await exit.call(document)
  }

  await unlockOrientation().catch(() => {})
}

function hasVideoFullscreen() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement)
}

async function lockLandscape() {
  const orientation = screen.orientation
  if (!orientation?.lock) return
  await orientation.lock('landscape')
}

async function unlockOrientation() {
  const orientation = screen.orientation
  orientation?.unlock?.()
}

function canFallbackToAudioOnly(error) {
  return [
    'AbortError',
    'NotFoundError',
    'NotReadableError',
    'OverconstrainedError',
    'ConstraintNotSatisfiedError',
  ].includes(error?.name)
}

function mediaErrorMessage(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return 'Permita acesso a camera e ao microfone para entrar na chamada.'
  }

  if (error?.name === 'NotFoundError') {
    return 'Nao encontramos camera ou microfone disponivel neste dispositivo.'
  }

  if (error?.name === 'NotReadableError' || error?.name === 'AbortError') {
    return 'Nao foi possivel iniciar a camera. Feche outros apps que possam estar usando a camera e tente novamente.'
  }

  if (error?.message) return error.message

  return 'Nao foi possivel acessar camera e microfone.'
}

function Avatar({ participant }) {
  const avatarUrl = normalizeAvatarUrl(participant?.avatar)
  const name = participant?.name || ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const initials = parts.length ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'CT'

  return (
    <span className="video-call-avatar" aria-hidden="true">
      {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
    </span>
  )
}

function statusLabel(status) {
  if (status === 'ringing') return 'Chamando...'
  if (status === 'connecting') return 'Conectando...'
  if (status === 'missed') return 'Chamada perdida'
  if (status === 'rejected') return 'Chamada recusada'
  if (status === 'ended') return 'Chamada encerrada'
  return 'Em chamada'
}

function encodeSessionDescription(description) {
  return {
    type: description.type,
    sdp_base64: btoa(description.sdp),
  }
}

function decodeSessionDescription(payload = {}) {
  const description = payload.description || payload.sdp
  const sdp = description?.sdp_base64 ? atob(description.sdp_base64) : description?.sdp
  return new RTCSessionDescription({
    type: description?.type,
    sdp,
  })
}

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8.1 4.5 9.8 8c.4.8.2 1.7-.4 2.3l-1 1a11.7 11.7 0 0 0 4.3 4.3l1-1c.6-.6 1.5-.8 2.3-.4l3.5 1.7c.8.4 1.2 1.2 1 2.1l-.5 2.1c-.2.8-.9 1.4-1.7 1.4C9.6 21.4 2.6 14.4 2.6 5.7c0-.8.6-1.5 1.4-1.7l2.1-.5c.9-.2 1.7.2 2 .9Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function PhoneOffIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.8 13.7c4.5-3.7 9.9-3.7 14.4 0 .5.4.6 1.2.2 1.7l-1.5 2c-.4.5-1 .7-1.6.4l-2.4-1.1a1.4 1.4 0 0 1-.8-1.2v-1.1a10.2 10.2 0 0 0-2.2 0v1.1c0 .5-.3 1-.8 1.2l-2.4 1.1c-.6.3-1.3.1-1.6-.4l-1.5-2c-.4-.5-.3-1.3.2-1.7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function MicIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3ZM19 11a7 7 0 0 1-14 0M12 18v3M9 21h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function MicOffIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 4 16 16M9 9v2a3 3 0 0 0 4.7 2.5M15 9.4V6a3 3 0 0 0-5.1-2.1M19 11a7 7 0 0 1-1.7 4.6M5 11a7 7 0 0 0 9.7 6.4M12 18v3M9 21h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function CameraIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2ZM16 10l6-3v10l-6-3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
}

function CameraOffIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 4 16 16M8.5 7H14a2 2 0 0 1 2 2v5.5M13 17H4a2 2 0 0 1-2-2V9c0-1 .7-1.8 1.6-2M16 10l6-3v9M8 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ScreenIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v11H4V5ZM9 21h6M12 16v5M9 10l3-3 3 3M12 7v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function MaximizeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function MinimizeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 9h4V5M15 5v4h4M19 15h-4v4M9 19v-4H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function EyeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" /></svg>
}

function EyeOffIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 4 16 16M9.9 5.4A10.3 10.3 0 0 1 12 5c6.1 0 9.5 7 9.5 7a15.1 15.1 0 0 1-2.2 3.1M6.1 6.9C3.7 8.6 2.5 12 2.5 12s3.4 7 9.5 7c1.5 0 2.8-.4 4-1M10.5 10.7a3 3 0 0 0 3.8 3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
