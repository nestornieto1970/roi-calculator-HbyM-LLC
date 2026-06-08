import { useState, useEffect } from "react";

const SUPABASE_URL = "https://oxcujtxhmiseaaloveqx.supabase.co";
const SUPABASE_KEY = "sb_publishable_0DB86Wu12YkIORtVM1ysew_lVn1sWS1";

const supabase = {
  async insert(record) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Prefer": "return=representation" },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async update(id, record) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/properties?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Prefer": "return=representation" },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async fetchAll() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/properties?order=created_at.desc`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async remove(id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/properties?id=eq.${id}`, {
      method: "DELETE",
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) throw new Error(await res.text());
  },
};

const fmt = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v || 0);
const fmtPct = (v) => (isNaN(v) || !isFinite(v) ? "—" : v.toFixed(2) + "%");

function SliderField({ label, value, onChange, min, max, step = 100, prefix = "$", suffix = "" }) {
  const pct = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #F0F2F5" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "13px", color: "#555", fontWeight: "600" }}>{label}</span>
        <span style={{ fontSize: "15px", fontWeight: "700", color: "#1A1A2E", fontFamily: "monospace" }}>{prefix}{Number(value).toLocaleString("en-US")}{suffix}</span>
      </div>
      <div style={{ position: "relative", height: "36px", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: "6px", background: "#E8ECF0", borderRadius: "3px" }} />
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "6px", background: "linear-gradient(90deg, #3B82F6, #1D4ED8)", borderRadius: "3px" }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
          style={{ position: "absolute", left: 0, right: 0, width: "100%", appearance: "none", WebkitAppearance: "none", background: "transparent", height: "36px", cursor: "pointer", margin: 0 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
        <span style={{ fontSize: "10px", color: "#AAB0BB" }}>{prefix}{Number(min).toLocaleString("en-US")}</span>
        <span style={{ fontSize: "10px", color: "#AAB0BB" }}>{prefix}{Number(max).toLocaleString("en-US")}</span>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder = "" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F0F2F5" }}>
      <span style={{ fontSize: "13px", color: "#555", fontWeight: "600", width: "130px", flexShrink: 0 }}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, border: "none", borderBottom: "1.5px solid #E0E4EA", background: "transparent", fontSize: "14px", color: "#1A1A2E", padding: "4px 0", outline: "none", fontFamily: "inherit" }} />
    </div>
  );
}

const emptyWhatsApp = () => ({ show: false, prop: null, type: null, message: "" });

const emptyForm = () => ({
  purchasePrice: 250000, remodelCost: 20000, hoaMonthly: 242,
  insuranceAnnual: 1200, propertyTax: 1400, rentMonthly: 1600,
  saleValue: "", listingUrl: "",
  propName: "", condo: "", realtorName: "", realtorPhone: "", realtorEmail: "",
});

export default function App() {
  const [tab, setTab] = useState("calc");
  const [savedProps, setSavedProps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [wa, setWa] = useState(emptyWhatsApp());

  const [form, setForm] = useState(emptyForm());
  const { purchasePrice, remodelCost, hoaMonthly, insuranceAnnual, propertyTax, rentMonthly, saleValue, listingUrl, propName, condo, realtorName, realtorPhone, realtorEmail } = form;
  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const TARGET = 8;
  const totalInvestment = purchasePrice + remodelCost;
  const annualRent = rentMonthly * 12;
  const annualExpenses = hoaMonthly * 12 + insuranceAnnual + propertyTax;
  const netAnnual = annualRent - annualExpenses;
  const roi = totalInvestment > 0 ? (netAnnual / totalInvestment) * 100 : 0;
  const neededRentMonthly = Math.ceil((totalInvestment * TARGET / 100 + annualExpenses) / 12);
  const neededPurchase = Math.floor(netAnnual / (TARGET / 100) - remodelCost);
  const roiColor = roi >= TARGET ? "#16A34A" : roi >= 6 ? "#D97706" : "#DC2626";
  const barPct = Math.min(Math.max((roi / 12) * 100, 0), 100);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const loadProperties = async () => {
    setLoading(true);
    try { setSavedProps(await supabase.fetchAll()); } catch { showToast("Error cargando propiedades", false); }
    setLoading(false);
  };

  useEffect(() => { loadProperties(); }, []);

  const buildRecord = () => ({
    prop_name: propName, condo, realtor_name: realtorName, realtor_phone: realtorPhone, realtor_email: realtorEmail,
    purchase_price: purchasePrice, remodel_cost: remodelCost, hoa_monthly: hoaMonthly,
    insurance_annual: insuranceAnnual, property_tax: propertyTax, rent_monthly: rentMonthly,
    sale_value: saleValue ? Number(saleValue) : null, listing_url: listingUrl || null,
    roi: parseFloat(roi.toFixed(2)), net_annual: netAnnual,
  });

  const save = async () => {
    if (!propName) return showToast("Agrega el nombre de la propiedad.", false);
    setSaving(true);
    try {
      if (editingId) {
        await supabase.update(editingId, buildRecord());
        showToast("✅ Propiedad actualizada.");
        setEditingId(null);
      } else {
        await supabase.insert(buildRecord());
        showToast("✅ Propiedad guardada.");
      }
      setForm(emptyForm());
      await loadProperties();
    } catch (e) { showToast("Error: " + e.message, false); }
    setSaving(false);
  };

  const startEdit = (p) => {
    setForm({
      purchasePrice: p.purchase_price, remodelCost: p.remodel_cost, hoaMonthly: p.hoa_monthly,
      insuranceAnnual: p.insurance_annual, propertyTax: p.property_tax, rentMonthly: p.rent_monthly,
      saleValue: p.sale_value || "", listingUrl: p.listing_url || "",
      propName: p.prop_name || "", condo: p.condo || "", realtorName: p.realtor_name || "",
      realtorPhone: p.realtor_phone || "", realtorEmail: p.realtor_email || "",
    });
    setEditingId(p.id);
    setTab("calc");
    window.scrollTo(0, 0);
  };

  const cancelEdit = () => { setForm(emptyForm()); setEditingId(null); };

  const del = async (id) => {
    try { await supabase.remove(id); setSavedProps(prev => prev.filter(p => p.id !== id)); showToast("🗑 Eliminada."); }
    catch { showToast("Error eliminando", false); }
  };

  const openWhatsApp = (p) => setWa({ show: true, prop: p, type: null, message: "" });

  const selectWaType = (type) => {
    const p = wa.prop;
    const name = p.realtor_name || "Estimado/a";
    const price = fmt(p.purchase_price);
    const propNameText = p.prop_name ? `"${p.prop_name}"` : "la propiedad";
    const msg = type === "offer"
      ? `Saludos ${name}, después de nuestros análisis de inversión y reparaciones, estamos muy interesados en la propiedad ${propNameText} y queremos hacer una oferta de compra por el valor de ${price}. Esta oferta será válida por 48 horas.`
      : `Saludos ${name}, después de nuestros análisis de inversión y reparaciones, declinamos hacer una oferta de compra de la propiedad ${propNameText}.`;
    setWa(prev => ({ ...prev, type, message: msg }));
  };

  const sendWhatsApp = () => {
    const phone = (wa.prop.realtor_phone || "").replace(/\D/g, "");
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(wa.message)}`
      : `https://wa.me/?text=${encodeURIComponent(wa.message)}`;
    window.open(url, "_blank");
    setWa(emptyWhatsApp());
  };

  const exportCSV = () => {
    if (!savedProps.length) return showToast("No hay propiedades guardadas.", false);
    const h = ["Nombre","Condominio","Realtor","Teléfono","Email","Precio Compra","Remodelación","HOA Mensual","Seguro Anual","Property Tax","Renta Mensual","Precio Venta","Link","ROI %","Neto Anual","Fecha"];
    const rows = savedProps.map(p => [p.prop_name,p.condo,p.realtor_name,p.realtor_phone,p.realtor_email,p.purchase_price,p.remodel_cost,p.hoa_monthly,p.insurance_annual,p.property_tax,p.rent_monthly,p.sale_value,p.listing_url,p.roi,p.net_annual,new Date(p.created_at).toLocaleDateString("es-PR")]);
    const csv = [h,...rows].map(r => r.map(v => `"${v??""}"` ).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "propiedades_roi.csv"; a.click();
  };

  const sliderStyle = `
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: white; border: 3px solid #3B82F6; box-shadow: 0 2px 6px rgba(59,130,246,0.4); cursor: pointer; }
    input[type=range]::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: white; border: 3px solid #3B82F6; box-shadow: 0 2px 6px rgba(59,130,246,0.4); cursor: pointer; }
  `;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#F8F9FB", minHeight: "100vh", maxWidth: "430px", margin: "0 auto", paddingBottom: "80px" }}>
      <style>{sliderStyle}</style>

      {toast && (
        <div style={{ position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#16A34A" : "#DC2626", color: "#fff", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", zIndex: 999, boxShadow: "0 4px 12px rgba(0,0,0,0.2)", whiteSpace: "nowrap" }}>
          {toast.msg}
        </div>
      )}

      {/* WhatsApp Modal */}
      {wa.show && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: "#fff", width: "100%", borderRadius: "20px 20px 0 0", padding: "24px 20px", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#1A1A2E", marginBottom: "6px" }}>📲 Enviar mensaje por WhatsApp</div>
            <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "20px" }}>{wa.prop.prop_name || "Propiedad"} — {wa.prop.realtor_name || "Realtor"}</div>

            {!wa.type ? (
              <>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Selecciona el tipo de mensaje:</div>
                <button onClick={() => selectWaType("offer")} style={{ width: "100%", padding: "16px", background: "#F0FDF4", border: "2px solid #86EFAC", borderRadius: "12px", color: "#16A34A", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", marginBottom: "10px", textAlign: "left" }}>
                  ✅ Ofertar
                  <div style={{ fontSize: "12px", fontWeight: "400", color: "#6B7280", marginTop: "4px" }}>Enviar oferta de compra por {fmt(wa.prop.purchase_price)}</div>
                </button>
                <button onClick={() => selectWaType("decline")} style={{ width: "100%", padding: "16px", background: "#FEF2F2", border: "2px solid #FCA5A5", borderRadius: "12px", color: "#DC2626", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", marginBottom: "10px", textAlign: "left" }}>
                  ❌ Declinar
                  <div style={{ fontSize: "12px", fontWeight: "400", color: "#6B7280", marginTop: "4px" }}>Informar que no haremos oferta</div>
                </button>
                <button onClick={() => setWa(emptyWhatsApp())} style={{ width: "100%", padding: "13px", background: "transparent", border: "1px solid #E5E7EB", borderRadius: "12px", color: "#6B7280", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Revisa el mensaje:</div>
                <textarea
                  value={wa.message}
                  onChange={(e) => setWa(prev => ({ ...prev, message: e.target.value }))}
                  style={{ width: "100%", minHeight: "140px", padding: "12px", border: "1.5px solid #E0E4EA", borderRadius: "12px", fontSize: "14px", color: "#1A1A2E", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }}
                />
                <button onClick={sendWhatsApp} style={{ width: "100%", padding: "16px", background: "#25D366", border: "none", borderRadius: "12px", color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", marginTop: "10px", marginBottom: "8px" }}>
                  📲 Enviar por WhatsApp
                </button>
                <button onClick={() => setWa(prev => ({ ...prev, type: null, message: "" }))} style={{ width: "100%", padding: "13px", background: "transparent", border: "1px solid #E5E7EB", borderRadius: "12px", color: "#6B7280", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>← Volver</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "#1D4ED8", padding: "24px 20px 18px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", color: "#93C5FD", textTransform: "uppercase" }}>Real Estate</div>
        <div style={{ fontSize: "22px", fontWeight: "700", color: "#fff", marginTop: "2px" }}>ROI Calculator</div>
        <div style={{ fontSize: "14px", fontWeight: "700", color: "#BFDBFE", marginTop: "1px" }}>Home By Madana, LLC</div>
        <div style={{ fontSize: "12px", color: "#93C5FD", marginTop: "2px" }}>Meta: {TARGET}% retorno anual</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid #E5E7EB" }}>
        {[["calc", editingId ? "✏️ Editando" : "📐 Calculadora"], ["saved", `📁 Guardadas (${savedProps.length})`]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex: 1, padding: "13px", border: "none", background: "transparent",
            color: tab === k ? "#1D4ED8" : "#6B7280", fontWeight: tab === k ? "700" : "500",
            fontSize: "13px", cursor: "pointer", fontFamily: "inherit",
            borderBottom: tab === k ? "2px solid #1D4ED8" : "2px solid transparent",
          }}>{l}</button>
        ))}
      </div>

      {tab === "calc" && (
        <div style={{ padding: "16px" }}>

          {editingId && (
            <div style={{ background: "#FEF3C7", borderRadius: "12px", padding: "12px 16px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#92400E" }}>✏️ Modo edición</span>
              <button onClick={cancelEdit} style={{ background: "transparent", border: "1px solid #D97706", borderRadius: "8px", padding: "4px 10px", color: "#92400E", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
            </div>
          )}

          {/* ROI Card */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", marginBottom: "14px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase" }}>ROI Actual</div>
                <div style={{ fontSize: "44px", fontWeight: "700", color: roiColor, fontFamily: "monospace", lineHeight: 1.1 }}>{fmtPct(roi)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase" }}>Neto Anual</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#1A1A2E", fontFamily: "monospace" }}>{fmt(netAnnual)}</div>
              </div>
            </div>
            <div style={{ position: "relative", height: "8px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "6px" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${barPct}%`, background: roiColor, borderRadius: "4px", transition: "width 0.3s" }} />
              <div style={{ position: "absolute", left: `${(TARGET/12)*100}%`, top: "-5px", width: "2px", height: "18px", background: "#3B82F6" }} />
              <div style={{ position: "absolute", left: `${(TARGET/12)*100}%`, top: "-18px", transform: "translateX(-50%)", fontSize: "9px", color: "#3B82F6", fontWeight: "700" }}>8%</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "14px" }}>
              {[["Renta p/llegar al 8%", fmt(neededRentMonthly)+"/mo"],["Precio máx. de compra", fmt(neededPurchase)]].map(([l,v]) => (
                <div key={l} style={{ background: "#EFF6FF", borderRadius: "10px", padding: "10px 12px" }}>
                  <div style={{ fontSize: "10px", color: "#60A5FA", fontWeight: "700", marginBottom: "2px" }}>{l}</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#1D4ED8", fontFamily: "monospace" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "18px 16px", marginBottom: "14px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize: "11px", fontWeight: "800", color: "#3B82F6", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>🏠 Ingresos</div>
            <SliderField label="Renta Mensual" value={rentMonthly} onChange={set("rentMonthly")} min={500} max={8000} step={50} suffix="/mo" />

            <div style={{ fontSize: "11px", fontWeight: "800", color: "#3B82F6", letterSpacing: "0.12em", textTransform: "uppercase", margin: "16px 0 4px" }}>💰 Inversión Inicial</div>
            <SliderField label="Precio de Compra" value={purchasePrice} onChange={set("purchasePrice")} min={100000} max={1000000} step={5000} />
            <SliderField label="Remodelación" value={remodelCost} onChange={set("remodelCost")} min={0} max={150000} step={1000} />

            <div style={{ fontSize: "11px", fontWeight: "800", color: "#3B82F6", letterSpacing: "0.12em", textTransform: "uppercase", margin: "16px 0 4px" }}>📋 Gastos</div>
            <SliderField label="HOA Mensual" value={hoaMonthly} onChange={set("hoaMonthly")} min={0} max={1500} step={10} suffix="/mo" />
            <SliderField label="Seguro Anual" value={insuranceAnnual} onChange={set("insuranceAnnual")} min={0} max={10000} step={100} />
            <SliderField label="Property Tax" value={propertyTax} onChange={set("propertyTax")} min={0} max={15000} step={100} />
          </div>

          {/* Resumen */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "16px", marginBottom: "14px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize: "11px", fontWeight: "800", color: "#3B82F6", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>📊 Resumen</div>
            {[
              ["Inversión Total", fmt(totalInvestment), "#1A1A2E"],
              ["Ingresos Anuales", fmt(annualRent), "#16A34A"],
              ["Gastos Anuales", fmt(annualExpenses), "#DC2626"],
              ["Neto Anual", fmt(netAnnual), netAnnual >= 0 ? "#16A34A" : "#DC2626"],
              ["ROI Anual", fmtPct(roi), roiColor],
            ].map(([l,v,c]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: "13px", color: "#6B7280" }}>{l}</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: c, fontFamily: "monospace" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Property Info */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "16px", marginBottom: "14px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize: "11px", fontWeight: "800", color: "#3B82F6", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>📌 Datos de la Propiedad</div>
            <TextField label="Nombre" value={propName} onChange={set("propName")} placeholder="Ej. Apt 3B Condado" />
            <TextField label="Condominio" value={condo} onChange={set("condo")} placeholder="Nombre del complejo" />
            <TextField label="Link anuncio" value={listingUrl} onChange={set("listingUrl")} placeholder="https://..." />
            <TextField label="Precio de Venta" value={saleValue} onChange={set("saleValue")} placeholder="Ej. 280000" />
            <div style={{ fontSize: "11px", fontWeight: "800", color: "#3B82F6", letterSpacing: "0.12em", textTransform: "uppercase", margin: "14px 0 6px" }}>👤 Realtor</div>
            <TextField label="Nombre" value={realtorName} onChange={set("realtorName")} placeholder="Nombre completo" />
            <TextField label="Teléfono" value={realtorPhone} onChange={set("realtorPhone")} placeholder="787-000-0000" />
            <TextField label="Email" value={realtorEmail} onChange={set("realtorEmail")} placeholder="email@ejemplo.com" />
          </div>

          <button onClick={save} disabled={saving} style={{
            width: "100%", padding: "16px", background: saving ? "#93C5FD" : editingId ? "#D97706" : "#1D4ED8", border: "none",
            borderRadius: "14px", color: "#fff", fontSize: "15px", fontWeight: "700",
            cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: "12px",
          }}>{saving ? "⏳ Guardando..." : editingId ? "✏️ Actualizar Propiedad" : "💾 Guardar en Supabase"}</button>

          {/* WhatsApp button on calculator */}
          {realtorPhone && (
            <button onClick={() => openWhatsApp({ realtor_name: realtorName, realtor_phone: realtorPhone, purchase_price: purchasePrice, prop_name: propName })} style={{
              width: "100%", padding: "16px", background: "#25D366", border: "none",
              borderRadius: "14px", color: "#fff", fontSize: "15px", fontWeight: "700",
              cursor: "pointer", fontFamily: "inherit",
            }}>📲 Enviar Oferta por WhatsApp</button>
          )}
        </div>
      )}

      {tab === "saved" && (
        <div style={{ padding: "16px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#9CA3AF" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
              <div style={{ fontWeight: "600" }}>Cargando propiedades...</div>
            </div>
          ) : savedProps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#9CA3AF" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏠</div>
              <div style={{ fontWeight: "600" }}>No hay propiedades guardadas aún.</div>
            </div>
          ) : (
            <>
              <button onClick={exportCSV} style={{ width: "100%", padding: "13px", background: "#fff", border: "1.5px solid #3B82F6", borderRadius: "12px", color: "#1D4ED8", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", marginBottom: "14px" }}>
                📊 Exportar CSV para Google Sheets
              </button>
              {savedProps.map((p) => {
                const c = Number(p.roi) >= TARGET ? "#16A34A" : Number(p.roi) >= 6 ? "#D97706" : "#DC2626";
                return (
                  <div key={p.id} style={{ background: "#fff", borderRadius: "14px", padding: "16px", marginBottom: "12px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", borderLeft: `4px solid ${c}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "15px", color: "#1A1A2E" }}>{p.prop_name || "Sin nombre"}</div>
                        {p.condo && <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>{p.condo}</div>}
                        {p.realtor_name && <div style={{ fontSize: "12px", color: "#6B7280" }}>👤 {p.realtor_name}</div>}
                        {p.realtor_phone && <div style={{ fontSize: "12px", color: "#6B7280" }}>📞 {p.realtor_phone}</div>}
                        {p.listing_url && <a href={p.listing_url} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#3B82F6" }}>🔗 Ver anuncio</a>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "26px", fontWeight: "700", color: c, fontFamily: "monospace" }}>{p.roi}%</div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{new Date(p.created_at).toLocaleDateString("es-PR")}</div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "12px" }}>
                      {[
                        ["Compra", fmt(p.purchase_price)],
                        ["Renta", fmt(p.rent_monthly)+"/mo"],
                        ["Neto", fmt(p.net_annual)+"/yr"],
                        ...(p.sale_value ? [["Precio Venta", fmt(p.sale_value)]] : []),
                      ].map(([l,v]) => (
                        <div key={l} style={{ background: "#F8F9FB", borderRadius: "8px", padding: "8px" }}>
                          <div style={{ fontSize: "9px", color: "#9CA3AF", textTransform: "uppercase", fontWeight: "700" }}>{l}</div>
                          <div style={{ fontSize: "12px", fontWeight: "700", fontFamily: "monospace", color: "#1A1A2E" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button onClick={() => startEdit(p)} style={{ flex: 1, padding: "7px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "8px", color: "#1D4ED8", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "700" }}>✏️ Editar</button>
                      <button onClick={() => openWhatsApp(p)} style={{ flex: 1, padding: "7px", background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "8px", color: "#16A34A", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "700" }}>📲 WhatsApp</button>
                      <button onClick={() => del(p.id)} style={{ flex: 1, padding: "7px", background: "transparent", border: "1px solid #FCA5A5", borderRadius: "8px", color: "#DC2626", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>🗑 Eliminar</button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
