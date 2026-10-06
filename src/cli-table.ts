interface RenderTableInput {
  headers: string[]
  rows: string[][]
}

export function renderTable(input: RenderTableInput): string {
  const { headers, rows } = input
  const widths = headers.map((header, columnIndex) => {
    const rowWidths = rows.map((row) => row[columnIndex]?.length ?? 0)
    return Math.max(header.length, ...rowWidths)
  })

  const renderLine = (row: string[]): string =>
    `| ${row.map((cell, index) => cell.padEnd(widths[index] ?? 0)).join(' | ')} |`

  const divider = `|-${widths.map((width) => '-'.repeat(width)).join('-|-')}-|`

  return [renderLine(headers), divider, ...rows.map((row) => renderLine(row))].join('\n')
}
