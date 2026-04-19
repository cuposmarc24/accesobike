function BikeLoader({ bg = '#111f22', color = '#13c8ec', text = '' }) {
  return (
    <div style={{
      background: bg,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '24px'
    }}>
      <style>{`
        .ab-bike__body, .ab-bike__front, .ab-bike__handlebars,
        .ab-bike__pedals, .ab-bike__pedals-spin, .ab-bike__seat,
        .ab-bike__spokes, .ab-bike__spokes-spin, .ab-bike__tire {
          animation: bikeBody 3s ease-in-out infinite;
          stroke: ${color};
        }
        .ab-bike__front      { animation-name: bikeFront; }
        .ab-bike__handlebars { animation-name: bikeHandlebars; }
        .ab-bike__pedals     { animation-name: bikePedals; }
        .ab-bike__pedals-spin{ animation-name: bikePedalsSpin; }
        .ab-bike__seat       { animation-name: bikeSeat; }
        .ab-bike__spokes     { animation-name: bikeSpokes; }
        .ab-bike__spokes-spin{ animation-name: bikeSpokesSpin; }
        .ab-bike__tire       { animation-name: bikeTire; }
      `}</style>

      <svg viewBox="0 0 48 30" style={{ width: '14em', height: 'auto', display: 'block' }}>
        <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1">
          <g transform="translate(9.5,19)">
            <circle className="ab-bike__tire" r="9" strokeDasharray="56.549 56.549" />
            <g className="ab-bike__spokes-spin" strokeDasharray="31.416 31.416" strokeDashoffset="-23.562">
              <circle className="ab-bike__spokes" r="5" />
              <circle className="ab-bike__spokes" r="5" transform="rotate(180,0,0)" />
            </g>
          </g>
          <g transform="translate(24,19)">
            <g className="ab-bike__pedals-spin" strokeDasharray="25.133 25.133" strokeDashoffset="-21.991" transform="rotate(67.5,0,0)">
              <circle className="ab-bike__pedals" r="4" />
              <circle className="ab-bike__pedals" r="4" transform="rotate(180,0,0)" />
            </g>
          </g>
          <g transform="translate(38.5,19)">
            <circle className="ab-bike__tire" r="9" strokeDasharray="56.549 56.549" />
            <g className="ab-bike__spokes-spin" strokeDasharray="31.416 31.416" strokeDashoffset="-23.562">
              <circle className="ab-bike__spokes" r="5" />
              <circle className="ab-bike__spokes" r="5" transform="rotate(180,0,0)" />
            </g>
          </g>
          <polyline className="ab-bike__seat" points="14 3,18 3" strokeDasharray="5 5" />
          <polyline className="ab-bike__body" points="16 3,24 19,9.5 19,18 8,34 7,24 19" strokeDasharray="79 79" />
          <path className="ab-bike__handlebars" d="m30,2h6s1,0,1,1-1,1-1,1" strokeDasharray="10 10" />
          <polyline className="ab-bike__front" points="32.5 2,38.5 19" strokeDasharray="19 19" />
        </g>
      </svg>

      {text && (
        <p style={{
          color: color,
          fontSize: '13px',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: '500',
          letterSpacing: '0.05em',
          margin: 0,
          opacity: 0.7
        }}>
          {text}
        </p>
      )}
    </div>
  );
}

export default BikeLoader;
