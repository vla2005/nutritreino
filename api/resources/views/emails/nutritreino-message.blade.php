<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? 'NutriTreino' }}</title>
</head>
<body style="margin:0; padding:0; background:#eef5f1; color:#14231b; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef5f1; margin:0; padding:36px 14px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px; margin:0 auto;">
                    <tr>
                        <td align="center" style="padding:0 0 22px;">
                            <div style="display:inline-block; padding:10px 16px; border-radius:999px; background:#ffffff; color:#15935f; font-size:14px; font-weight:800; letter-spacing:.02em;">
                                NutriTreino
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="border-radius:24px; background:#ffffff; padding:6px; box-shadow:0 22px 60px rgba(28, 64, 45, .12);">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:20px; background:#fbfefd; border:1px solid #dfece5; overflow:hidden;">
                                <tr>
                                    <td style="padding:34px 34px 18px;">
                                        <p style="margin:0 0 12px; color:#15935f; font-size:12px; font-weight:800; letter-spacing:.13em; text-transform:uppercase;">
                                            {{ $eyebrow ?? 'NutriTreino' }}
                                        </p>

                                        <h1 style="margin:0; color:#102018; font-size:28px; line-height:1.18; font-weight:800;">
                                            {{ $headline ?? 'Ola.' }}
                                        </h1>

                                        <p style="margin:18px 0 0; color:#4d6358; font-size:16px; line-height:1.65;">
                                            {{ $intro ?? '' }}
                                        </p>
                                    </td>
                                </tr>

                                @if (! empty($highlight))
                                    <tr>
                                        <td style="padding:0 34px 4px;">
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:18px; background:#edf8f2; border:1px solid #d7eee1;">
                                                <tr>
                                                    <td style="padding:18px 20px;">
                                                        <p style="margin:0; color:#1d4632; font-size:15px; line-height:1.6; font-weight:700;">
                                                            {{ $highlight }}
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                @endif

                                @if (! empty($actionUrl) && ! empty($actionLabel))
                                    <tr>
                                        <td align="center" style="padding:28px 34px 30px;">
                                            <a href="{{ $actionUrl }}" style="display:inline-block; min-width:190px; border-radius:999px; background:#2fa66f; color:#ffffff; font-size:15px; font-weight:800; line-height:1; text-align:center; text-decoration:none; padding:16px 24px; box-shadow:0 14px 30px rgba(47,166,111,.26);">
                                                {{ $actionLabel }}
                                            </a>
                                        </td>
                                    </tr>
                                @endif

                                @if (! empty($footerNote))
                                    <tr>
                                        <td style="padding:0 34px 32px;">
                                            <p style="margin:0; color:#74847b; font-size:13px; line-height:1.6;">
                                                {{ $footerNote }}
                                            </p>
                                        </td>
                                    </tr>
                                @endif
                            </table>
                        </td>
                    </tr>

                    @if (! empty($actionUrl))
                        <tr>
                            <td align="center" style="padding:22px 24px 0;">
                                <p style="margin:0 0 8px; color:#71837a; font-size:12px; line-height:1.5;">
                                    Se o botao nao funcionar, copie e cole este link no navegador:
                                </p>
                                <p style="margin:0; color:#15935f; font-size:12px; line-height:1.6; word-break:break-all;">
                                    <a href="{{ $actionUrl }}" style="color:#15935f; text-decoration:underline;">{{ $actionUrl }}</a>
                                </p>
                            </td>
                        </tr>
                    @endif

                    <tr>
                        <td align="center" style="padding:18px 24px 0;">
                            <p style="margin:0; color:#8a9a92; font-size:12px;">
                                © {{ date('Y') }} NutriTreino. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
