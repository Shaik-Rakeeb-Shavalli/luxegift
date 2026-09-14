import { formatPrice } from "./utils";

export interface InvoiceOrder {
  id?: string;
  orderNumber: string;
  date?: string;
  createdAt?: string;
  status: string;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?:
    | {
        name?: string;
        phone?: string;
        street?: string;
        address?: string;
        city?: string;
        state?: string;
        zip?: string;
      }
    | string;
  items: {
    name: string;
    qty?: number;
    quantity?: number;
    price?: number;
  }[];
}

/**
 * Opens a styled white-glove luxury Tax Invoice in a new window and triggers window.print()
 * so the user can save as PDF or print directly.
 */
export function downloadOrderInvoice(
  order: InvoiceOrder,
  userProfile?: { name?: string; email?: string; phone?: string },
  userAddresses?: { label?: string; address?: string }[]
) {
  const invoiceNo = `INV-${order.orderNumber}`;
  const orderDate = (() => {
    const rawDate = order.date || order.createdAt;
    if (!rawDate || rawDate === "Just now" || rawDate === "Recent") {
      return new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    const d = new Date(rawDate);
    return isNaN(d.getTime())
      ? String(rawDate)
      : d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  })();

  const customerName =
    userProfile?.name || order.customerName || "Valued Prestige Member";
  const customerEmail = userProfile?.email || order.customerEmail || "";
  const customerPhone = userProfile?.phone || order.customerPhone || "";

  // Resolve shipping address
  let addressStr = "Delivered to registered customer address";
  if (typeof order.shippingAddress === "string" && order.shippingAddress.trim()) {
    addressStr = order.shippingAddress;
  } else if (order.shippingAddress && typeof order.shippingAddress === "object") {
    const sa = order.shippingAddress as any;
    addressStr = [sa.street || sa.address, sa.city, sa.state, sa.zip]
      .filter(Boolean)
      .join(", ");
  } else if (userAddresses && userAddresses.length > 0) {
    const firstAddr = userAddresses[0];
    if (firstAddr.address) {
      addressStr = firstAddr.address;
    }
  }

  // Pricing calculations
  const grandTotal = order.total || 0;
  const itemsCount = (order.items || []).reduce(
    (acc, item) => acc + (item.qty || item.quantity || 1),
    0
  );

  const estimatedAvgPrice =
    itemsCount > 0 ? Math.round((grandTotal * 0.85) / itemsCount) : grandTotal;

  const itemRowsHtml = (order.items || [])
    .map((item, idx) => {
      const qty = item.qty || item.quantity || 1;
      const price = item.price || estimatedAvgPrice;
      const lineTotal = price * qty;
      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569;">${idx + 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #334155;">${qty}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">₹${price.toLocaleString("en-IN")}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0f172a;">₹${lineTotal.toLocaleString("en-IN")}</td>
      </tr>
    `;
    })
    .join("");

  const subtotalCalc = Math.round(grandTotal / 1.18);
  const gstCalc = grandTotal - subtotalCalc;
  const cgst = Math.round(gstCalc / 2);
  const sgst = gstCalc - cgst;

  const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>LuxeGift Tax Invoice - ${order.orderNumber}</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 40px;
          background-color: #f8fafc;
          color: #0f172a;
          line-height: 1.5;
        }
        .invoice-box {
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #D4AF37;
          padding-bottom: 24px;
          margin-bottom: 32px;
        }
        .logo-title {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: 3px;
          color: #0f172a;
          text-transform: uppercase;
        }
        .logo-sub {
          font-size: 10px;
          color: #D4AF37;
          letter-spacing: 4px;
          text-transform: uppercase;
          font-weight: 700;
          margin-top: 2px;
        }
        .invoice-title-block {
          text-align: right;
        }
        .invoice-badge {
          display: inline-block;
          background: #059669;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 8px;
        }
        .invoice-no {
          font-size: 18px;
          font-weight: 700;
          font-family: monospace;
          color: #1e293b;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }
        .info-card {
          background: #f8fafc;
          padding: 16px;
          border-radius: 6px;
          border-left: 3px solid #D4AF37;
        }
        .info-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #64748b;
          margin-bottom: 8px;
        }
        .info-detail {
          font-size: 13px;
          color: #334155;
          margin: 3px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 28px;
        }
        th {
          background: #0f172a;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          padding: 12px;
        }
        .totals-table {
          width: 320px;
          margin-left: auto;
          margin-bottom: 32px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
          color: #475569;
        }
        .totals-grand {
          display: flex;
          justify-content: space-between;
          padding: 12px 0 6px 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          border-top: 2px solid #0f172a;
          margin-top: 6px;
        }
        .seal-box {
          border: 2px dashed #D4AF37;
          border-radius: 8px;
          padding: 16px;
          background: #fffbeb;
          text-align: center;
          margin-bottom: 32px;
        }
        .seal-title {
          color: #b45309;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .seal-desc {
          color: #92400e;
          font-size: 11px;
          margin-top: 4px;
        }
        .footer {
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        .btn-print {
          background: #0f172a;
          color: #ffffff;
          border: none;
          padding: 10px 24px;
          font-size: 12px;
          font-weight: 700;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 20px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .btn-print:hover {
          background: #D4AF37;
          color: #000000;
        }
      </style>
    </head>
    <body>
      <div style="text-align: center;" class="no-print">
        <button class="btn-print" onclick="window.print()">🖨 Print or Save as PDF</button>
      </div>

      <div class="invoice-box">
        <div class="header">
          <div>
            <div class="logo-title">LuxeGift</div>
            <div class="logo-sub">Curated Luxury Atelier</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 8px;">
              White-Glove Gifting & Concierge Atelier<br>
              GSTIN: 29AAACL1234F1Z8 | FSSAI: 11223999000111
            </div>
          </div>
          <div class="invoice-title-block">
            <span class="invoice-badge">✓ Order Delivered</span>
            <div class="invoice-no">${invoiceNo}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
              Date: <strong>${orderDate}</strong>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="info-card">
            <div class="info-title">Billed To (Prestige Member)</div>
            <div class="info-detail" style="font-weight: 700; color: #0f172a;">${customerName}</div>
            <div class="info-detail">${customerEmail}</div>
            ${customerPhone ? `<div class="info-detail">${customerPhone}</div>` : ""}
          </div>
          <div class="info-card">
            <div class="info-title">Shipping & White-Glove Hand-Delivery</div>
            <div class="info-detail" style="font-weight: 600;">Ref Order: <span style="font-family: monospace;">${order.orderNumber}</span></div>
            <div class="info-detail" style="color: #475569;">${addressStr}</div>
            <div class="info-detail" style="color: #059669; font-weight: 700; margin-top: 4px;">Status: White-Glove Hand-Delivered</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th style="text-align: left;">Curated Item Description</th>
              <th style="width: 60px; text-align: center;">Qty</th>
              <th style="width: 110px; text-align: right;">Unit Price</th>
              <th style="width: 120px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml}
          </tbody>
        </table>

        <div class="totals-table">
          <div class="totals-row">
            <span>Taxable Subtotal</span>
            <span>₹${subtotalCalc.toLocaleString("en-IN")}</span>
          </div>
          <div class="totals-row">
            <span>CGST (9% Inclusive)</span>
            <span>₹${cgst.toLocaleString("en-IN")}</span>
          </div>
          <div class="totals-row">
            <span>SGST (9% Inclusive)</span>
            <span>₹${sgst.toLocaleString("en-IN")}</span>
          </div>
          <div class="totals-row">
            <span>White-Glove Express Courier</span>
            <span style="color: #059669; font-weight: 700;">FREE</span>
          </div>
          <div class="totals-grand">
            <span>Total Paid</span>
            <span style="color: #c5a028;">₹${grandTotal.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div class="seal-box">
          <div class="seal-title">★ LUXEGIFT OFFICIAL PROOF OF DELIVERY ★</div>
          <div class="seal-desc">
            This white-glove curation was hand-delivered to the recipient and verified complete by LuxeGift Atelier logistics.
          </div>
        </div>

        <div class="footer">
          Thank you for choosing LuxeGift White-Glove Atelier for your luxury gifting experience.<br>
          For concierge assistance or corporate tax invoices, contact <strong>concierge@luxegift.com</strong> or call <strong>+91 1800-LUXEGIFT</strong>.
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=900,height=800");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  }
}
