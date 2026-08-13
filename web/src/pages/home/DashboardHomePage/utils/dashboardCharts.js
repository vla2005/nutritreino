export function buildDonutSegments(items, colors) {
  return items.reduce((result, item) => {
    const start = result.offset
    const end = start + item.percent
    return {
      offset: end,
      segments: [...result.segments, `${colors[item.tone] || colors.green} ${start}% ${end}%`],
    }
  }, { offset: 0, segments: [] }).segments.join(', ')
}
