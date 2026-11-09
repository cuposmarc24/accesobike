import { useState } from 'react';
import BottomSheet from './BottomSheet';

function AuctionModal({ isOpen, rodada, onClose, onSubmitBid, primaryColor = '#ffd700', backgroundColor = '#111f22' }) {
  const [formData, setFormData] = useState({ fullName: '', phone: '', bidAmount: '13' });

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (!formData.fullName || !formData.phone || !formData.bidAmount) {
      alert('Por favor completa todos los campos');
      return;
    }
    if (parseFloat(formData.bidAmount) < 13) {
      alert('El monto mínimo de subasta es $13');
      return;
    }
    onSubmitBid(formData);
  };

  const handleClose = () => {
    setFormData({ fullName: '', phone: '', bidAmount: '13' });
    onClose();
  };

  if (!isOpen) return null;

  const eventName = rodada?.event_name || (rodada === 'rodada1' ? 'Rodada 1' : 'Rodada 2');

  return (
    <BottomSheet
      theme={{ primaryColor, backgroundColor }}
      onClose={handleClose}
      ariaLabel="Subasta de asiento VIP"
      header={
        <div>
          <h2 className="ab-sheet-title">Subasta de asiento VIP</h2>
          <p className="ab-sheet-sub">{eventName} · oferta mínima $13</p>
        </div>
      }
      footer={(close) => (
        <>
          <button type="button" className="ab-btn ab-btn--ghost" style={{ flex: 1 }} onClick={close}>Cancelar</button>
          <button type="button" className="ab-btn ab-btn--primary" style={{ flex: 2 }} onClick={handleSubmit}>Enviar oferta</button>
        </>
      )}
    >
      <div className="ab-field">
        <label className="ab-label" htmlFor="ab-fullName">Nombre completo</label>
        <input id="ab-fullName" className="ab-input" style={{ paddingLeft: 14 }} name="fullName" value={formData.fullName} onChange={handleInputChange} />
      </div>
      <div className="ab-field">
        <label className="ab-label" htmlFor="ab-phone">Teléfono</label>
        <input id="ab-phone" className="ab-input" style={{ paddingLeft: 14 }} type="tel" inputMode="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
      </div>
      <div className="ab-field" style={{ marginBottom: 0 }}>
        <label className="ab-label" htmlFor="ab-bidAmount">Tu oferta</label>
        <div className="ab-input-wrap">
          <span className="ab-input-icon" aria-hidden="true">$</span>
          <input id="ab-bidAmount" className="ab-input" type="number" inputMode="decimal" min="13" step="0.01" name="bidAmount" value={formData.bidAmount} onChange={handleInputChange} />
        </div>
      </div>
    </BottomSheet>
  );
}

export default AuctionModal;
