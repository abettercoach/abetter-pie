export function buildCursorSVG(degrees: number): string {
    const svg = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(${degrees}, 12, 12)">
    <path d="M9 14L12 17L15 14M15 10L12 7L9 10" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    </svg>
    `;
    return encodeSvgToBase64(svg);
}

function encodeSvgToBase64(svgString: string): string {
  // 3. Base64 encode the binary string
  const base64 = btoa(svgString);

  // 4. Prefix with the data URI scheme
  const dataUri = `url('data:image/svg+xml;base64,${base64}') 12 12, auto`;

  return dataUri;
}