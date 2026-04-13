import { useState } from 'react';

/**
 * BookingConfirmation component.
 * Displays booking details after successful booking, with cancel option.
 *
 * Props:
 *   booking: object — booking data from API
 *   onCancelled: (result) => void — Called after successful cancellation
 */
export default function BookingConfirmation({ booking, onCancelled }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);
  const [error, setError] = useState('');

  async function handleCancel() {
    if (!confirm('இந்த பதிவை ரத்து செய்ய விரும்புகிறீர்களா?')) return;

    setCancelling(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/booking/${booking.bookingId}/cancel`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ரத்து செய்ய இயலவில்லை');
      }

      setCancelResult(data);
      if (onCancelled) onCancelled(data);
    } catch (err) {
      setError(err.message || 'ரத்து செய்ய இயலவில்லை');
    } finally {
      setCancelling(false);
    }
  }

  const isCancelled = booking.status === 'cancelled' || cancelResult;

  return (
    <div style={containerStyle(isCancelled)}>
      {/* Header */}
      <div style={headerStyle(isCancelled)}>
        <span style={{ fontSize: 22 }}>{isCancelled ? '❌' : '✅'}</span>
        <span style={{ fontWeight: 700, fontSize: 17 }}>
          {isCancelled
            ? 'பதிவு ரத்து செய்யப்பட்டது'
            : 'உங்கள் பயணம் உறுதி செய்யப்பட்டது!'}
        </span>
      </div>

      {/* Details grid */}
      <div style={detailsGridStyle}>
        <DetailRow label="பதிவு எண்" value={booking.bookingId} highlight />
        <DetailRow label="PNR எண்" value={booking.pnr} highlight />
        <DetailRow label="பயணம்" value={`${booking.travelName} (${booking.travelType})`} />
        <DetailRow label="வழித்தடம்" value={`${booking.source} → ${booking.destination}`} />
        <DetailRow label="பயணிகள்" value={`${booking.passengers} நபர்`} />
        <DetailRow label="மொத்த கட்டணம்" value={`₹${booking.totalPrice}`} />
        <DetailRow label="தொலைபேசி" value={booking.contactPhone} />
        <DetailRow
          label="நிலை"
          value={isCancelled ? 'ரத்து செய்யப்பட்டது' : 'உறுதி செய்யப்பட்டது'}
          valueColor={isCancelled ? '#c0392b' : '#27ae60'}
        />
      </div>

      {/* Cancellation refund info */}
      {cancelResult && (
        <div style={refundInfoStyle}>
          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>
            {cancelResult.refundPercent === 100 && '💰 முழு பணம் திருப்பி!'}
            {cancelResult.refundPercent === 50 && '💰 50% பணம் திருப்பி'}
            {cancelResult.refundPercent === 0 && '⚠️ பணம் திருப்பி அளிக்கப்படாது'}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
            {cancelResult.message}
          </p>
          {cancelResult.refundAmount > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#27ae60' }}>
              திருப்பி: ₹{cancelResult.refundAmount}
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={errorStyle}>⚠️ {error}</div>
      )}

      {/* Cancel button (only if not already cancelled) */}
      {!isCancelled && (
        <div style={{ marginTop: 16 }}>
          <div style={policyStyle}>
            <strong>ரத்து விதிமுறை:</strong><br />
            • 1 மணி நேரத்திற்குள் — 100% பணம் திருப்பி<br />
            • 1–24 மணி நேரம் — 50% பணம் திருப்பி<br />
            • 24 மணி நேரத்திற்கு மேல் — பணம் திருப்பி இல்லை
          </div>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            style={cancelBtnStyle(cancelling)}
          >
            {cancelling ? '⏳ ரத்து செய்கிறது...' : '✕ ரத்து செய்'}
          </button>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, highlight = false, valueColor = '' }) {
  return (
    <div style={detailRowStyle}>
      <span style={{ color: '#666', fontSize: 13 }}>{label}:</span>
      <span style={{
        fontWeight: highlight ? 700 : 500,
        fontSize: highlight ? 15 : 14,
        color: valueColor || (highlight ? '#2c3e50' : '#333'),
        fontFamily: highlight ? 'monospace' : 'inherit',
      }}>
        {value}
      </span>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
function containerStyle(cancelled) {
  return {
    background: cancelled ? '#fff5f5' : '#f0fff4',
    border: `1px solid ${cancelled ? '#fcc' : '#c6f6d5'}`,
    borderRadius: 10,
    padding: 20,
    marginTop: 12,
  };
}

function headerStyle(cancelled) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    color: cancelled ? '#c0392b' : '#27ae60',
  };
}

const detailsGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px 16px',
};

const detailRowStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const refundInfoStyle = {
  marginTop: 16,
  padding: '12px 16px',
  background: '#fffae6',
  border: '1px solid #ffe58f',
  borderRadius: 8,
};

const errorStyle = {
  color: '#c0392b',
  fontSize: 13,
  marginTop: 12,
  padding: '8px 12px',
  background: '#fde8e8',
  borderRadius: 6,
};

const policyStyle = {
  fontSize: 12,
  color: '#666',
  lineHeight: 1.6,
  marginBottom: 12,
  padding: '8px 12px',
  background: '#f8f9fa',
  borderRadius: 6,
};

function cancelBtnStyle(disabled) {
  return {
    background: disabled ? '#ccc' : '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  };
}
