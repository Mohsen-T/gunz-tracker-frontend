import { timeAgo } from '../utils/format';

export default function Footer({ lastUpdated, isMobile }) {
  if (isMobile) {
    return (
      <div style={{
        padding: '5px 10px', borderTop: '1px solid #142014', background: '#060b06',
        fontSize: 9, color: '#667', flexShrink: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: '#4ADE80',
            boxShadow: '0 0 4px #4ADE80',
          }} />
          LIVE
          {lastUpdated && <span style={{ color: '#556' }}> {timeAgo(lastUpdated)}</span>}
        </span>
        <span style={{ color: '#ccc', fontSize: 10, fontWeight: 700 }}>
          ☕{' '}
          <span
            onClick={() => { navigator.clipboard.writeText('0xb2ad0f31ec67881Fc06Cd67b6c7D6859c30582c6'); }}
            style={{ color: '#F97316', cursor: 'pointer', borderBottom: '1px dashed #F97316', fontWeight: 700 }}
            title="Click to copy"
          >
            0xb2ad...c30582c6
          </span>
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '5px 20px', borderTop: '1px solid #142014', background: '#060b06',
      fontSize: 11, color: '#667', flexShrink: 0,
    }}>
      <span>
        GRIDZILLA v1.0 — Powered by api.gunzchain.app
        {lastUpdated && <span style={{ color: '#778', marginLeft: 8 }}>Updated {timeAgo(lastUpdated)}</span>}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ color: '#ddd', fontSize: 12, fontWeight: 700 }}>
          ☕ Buy me a coffee?{' '}
          <span
            onClick={() => { navigator.clipboard.writeText('0xb2ad0f31ec67881Fc06Cd67b6c7D6859c30582c6'); }}
            style={{ color: '#F97316', cursor: 'pointer', borderBottom: '1px dashed #F97316', fontWeight: 700, fontSize: 11 }}
            title="Click to copy wallet address"
          >
            0xb2ad0f31ec67881Fc06Cd67b6c7D6859c30582c6
          </span>
        </span>
        <span style={{ color: '#333' }}>|</span>
        <span>Size = Hashpower</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: '#4ADE80',
            boxShadow: '0 0 4px #4ADE80',
          }} />
          LIVE
        </span>
      </div>
    </div>
  );
}
