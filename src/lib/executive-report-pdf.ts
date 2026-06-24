import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { formatBaht } from "@/lib/procurement";
import {
  formatProgressWithUnit,
  mergeStep1ProfileFromProject,
  type Step1ProjectProfile,
} from "@/lib/project-profile";
import { isExternalProcurement } from "@/lib/procurement-path";
import { STEP10_INSTALLMENT_STATUS_OPTIONS } from "@/lib/step10-contract";
import type { Step10InspectionRow } from "@/lib/step-form";
import { formatThaiDateSlash } from "@/lib/utils";

export type ExecutiveReportProject = {
  name: string;
  project_code: string;
  standard_model_code?: string | null;
  budget: number;
  fiscal_year?: number | null;
  procurement_path?: string | null;
  district_office?: string | null;
  approving_agency?: string | null;
  procurement_agency?: string | null;
  activity_type?: string | null;
  result_unit?: string | null;
  site_village?: string | null;
  site_moo?: number | null;
  site_subdistrict?: string | null;
  site_district?: string | null;
  site_province?: string | null;
  allocated_budget?: number | null;
  approved_median_price?: number | null;
  winning_bidder_name?: string | null;
  site_supervisor_name?: string | null;
  site_supervisor_affiliation?: string | null;
  site_engineer_name?: string | null;
  contract_no?: string | null;
  contract_signed_date?: string | null;
  final_agreed_amount?: number | null;
  winning_bid_amount?: number | null;
  total_installment_count?: number | null;
};

export type ExecutiveReportInput = {
  project: ExecutiveReportProject;
  inspectionRows: Step10InspectionRow[];
  contractAmount: number | null;
};

const cell =
  "padding:7px 10px;border:1px solid #333;font-size:12px;vertical-align:top;";
const labelCell = `${cell}background:#f3f4f6;width:32%;font-weight:600;color:#1f2937;`;
const valueCell = `${cell}background:#fff;color:#111;`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function displayText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? escapeHtml(trimmed) : "—";
}

function displayMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—";
  return `${formatBaht(value)}`;
}

function displayDate(iso: string | null | undefined): string {
  const trimmed = iso?.trim();
  return trimmed ? formatThaiDateSlash(trimmed) : "—";
}

function installmentStatusLabel(status: string): string {
  return (
    STEP10_INSTALLMENT_STATUS_OPTIONS.find((o) => o.value === status)?.label ??
    (status?.trim() || "—")
  );
}

function formRow(label: string, value: string): string {
  return `<tr><td style="${labelCell}">${escapeHtml(label)}</td><td style="${valueCell}">${value}</td></tr>`;
}

function buildReportHtml(input: ExecutiveReportInput): string {
  const profile: Step1ProjectProfile = mergeStep1ProfileFromProject(input.project);
  const contractAmount =
    input.contractAmount ??
    input.project.final_agreed_amount ??
    input.project.winning_bid_amount ??
    null;
  const allocated =
    input.project.allocated_budget != null && input.project.allocated_budget > 0
      ? input.project.allocated_budget
      : input.project.budget;
  const printDate = formatThaiDateSlash(new Date().toISOString().slice(0, 10));
  const externalNote = isExternalProcurement(input.project.procurement_path)
    ? " (สัญญาจัดซื้อจัดจ้างโดยส่วนกลาง/สพข.)"
    : "";

  const installmentRows =
    input.inspectionRows.length > 0
      ? input.inspectionRows
          .map(
            (row) => `
        <tr>
          <td style="${cell}text-align:center">${row.installment_no}</td>
          <td style="${cell}">${displayDate(row.planned_completion_date)}</td>
          <td style="${cell}">${displayDate(row.delivery_date)}</td>
          <td style="${cell}">${displayDate(row.inspection_date)}</td>
          <td style="${cell}text-align:center">${row.progress_pct != null ? `${row.progress_pct}%` : "—"}</td>
          <td style="${cell}text-align:right">${escapeHtml(formatProgressWithUnit(row.progress_cumulative_units, profile.result_unit))}</td>
          <td style="${cell}">${escapeHtml(installmentStatusLabel(row.installment_status))}</td>
        </tr>`,
          )
          .join("")
      : `<tr><td colspan="7" style="${cell}text-align:center;color:#666">ยังไม่มีข้อมูลงวดงาน</td></tr>`;

  const latestRow = [...input.inspectionRows]
    .reverse()
    .find(
      (r) =>
        r.delivery_date?.trim() ||
        r.inspection_date?.trim() ||
        r.progress_pct != null ||
        r.progress_cumulative_units != null,
    );

  const sectionTitle = (n: number, title: string) =>
    `<tr><td colspan="2" style="padding:10px 10px 6px;font-size:13px;font-weight:700;background:#dbeafe;border:1px solid #333;">${n}. ${escapeHtml(title)}</td></tr>`;

  return `
    <div style="font-family:'Sarabun',Tahoma,sans-serif;color:#111;line-height:1.45;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <tr>
          <td style="text-align:center;padding:8px 0;border:none;">
            <div style="font-size:16px;font-weight:700;">รายงานสรุปความก้าวหน้าโครงการจัดซื้อจัดจ้าง</div>
            <div style="font-size:13px;margin-top:4px;">เสนอผู้อำนวยการ / ผู้บริหาร${escapeHtml(externalNote)}</div>
            <div style="font-size:11px;color:#555;margin-top:6px;">พิมพ์เมื่อ ${escapeHtml(printDate)} · ProcureTrack</div>
          </td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
        ${sectionTitle(1, "ข้อมูลโครงการและหน่วยงาน (Step 1)")}
        ${formRow("ชื่อโครงการ", `<strong>${displayText(input.project.name)}</strong>`)}
        ${formRow("รหัส e-GP / โครงการ", displayText(input.project.project_code))}
        ${
          input.project.standard_model_code?.trim()
            ? formRow(
                "รหัสแบบมาตรฐาน (งานก่อสร้าง)",
                displayText(input.project.standard_model_code),
              )
            : ""
        }
        ${formRow("ปีงบประมาณ", input.project.fiscal_year ? String(input.project.fiscal_year) : "—")}
        ${formRow("หน่วยงานส่วนภูมิภาค / เขตที่รับผิดชอบ", displayText(profile.district_office))}
        ${formRow("หน่วยงานที่อนุมัติเบิกจ่าย", displayText(profile.approving_agency))}
        ${formRow("หน่วยงานที่ดำเนินการจัดซื้อจัดจ้าง", displayText(profile.procurement_agency))}
        ${formRow("ประเภทกิจกรรม/งาน", displayText(profile.activity_type))}
        ${formRow("หน่วยวัดผลสัมฤทธิ์ของงาน", displayText(profile.result_unit))}

        ${sectionTitle(2, "ที่ตั้งสถานที่ดำเนินการ (แยกฟิลด์)")}
        ${formRow("ชื่อบ้าน/หมู่บ้าน", displayText(profile.site_village))}
        ${formRow("หมู่ที่", profile.site_moo != null && profile.site_moo > 0 ? String(profile.site_moo) : "—")}
        ${formRow("ตำบล", displayText(profile.site_subdistrict))}
        ${formRow("อำเภอ", displayText(profile.site_district))}
        ${formRow("จังหวัด", displayText(profile.site_province))}

        ${sectionTitle(3, "งบประมาณและราคากลาง (Step 2)")}
        ${formRow("วงเงินงบประมาณที่ได้รับจัดสรร (บาท)", displayMoney(allocated))}
        ${formRow("มูลค่าราคากลางที่คณะกรรมการคำนวณ (บาท)", displayMoney(input.project.approved_median_price))}

        ${sectionTitle(4, "ผู้ควบคุมงานหน้างาน (Step 4)")}
        ${formRow("ชื่อ-นามสกุล ผู้ควบคุมงาน", displayText(input.project.site_supervisor_name))}
        ${formRow("ตำแหน่ง/สังกัด", displayText(input.project.site_supervisor_affiliation))}
        ${formRow("ชื่อ-นามสกุล วิศวกรผู้คำนวณ/คุมแบบ", displayText(input.project.site_engineer_name))}
        ${formRow("ผู้รับจ้าง (ผู้ชนะการเสนอราคา)", displayText(input.project.winning_bidder_name))}

        ${sectionTitle(5, "ข้อมูลสัญญา (Step 8–9)")}
        ${formRow("เลขที่สัญญา", displayText(input.project.contract_no))}
        ${formRow("วันลงนามสัญญา", displayDate(input.project.contract_signed_date))}
        ${formRow("ราคาประมูล/ราคาตามสัญญาจ้างจริง (บาท)", `<strong>${displayMoney(contractAmount)}</strong>`)}
        ${formRow(
          "จำนวนงวดงานทั้งหมด",
          input.project.total_installment_count != null &&
            input.project.total_installment_count > 0
            ? `${input.project.total_installment_count} งวด`
            : "—",
        )}
      </table>

      ${
        latestRow
          ? `<table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <tr>
          <td style="padding:8px 10px;border:1px solid #2563eb;background:#eff6ff;font-size:12px;">
            <strong>สรุปงวดล่าสุดที่บันทึก:</strong>
            งวดที่ ${latestRow.installment_no} · ความก้าวหน้า ${latestRow.progress_pct ?? "—"}% ·
            ผลสะสม ${escapeHtml(formatProgressWithUnit(latestRow.progress_cumulative_units, profile.result_unit))}
          </td>
        </tr>
      </table>`
          : ""
      }

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td colspan="7" style="padding:8px 10px;font-size:13px;font-weight:700;background:#dbeafe;border:1px solid #333;">
            6. ตารางตรวจรับงานรายงวด (Step 10)
          </td>
        </tr>
        <tr style="background:#e5e7eb;">
          <th style="${cell}text-align:center;">งวด</th>
          <th style="${cell}">กำหนดเสร็จตามแผน</th>
          <th style="${cell}">วันส่งมอบจริง</th>
          <th style="${cell}">วันตรวจรับ</th>
          <th style="${cell}text-align:center;">% ก้าวหน้า</th>
          <th style="${cell}text-align:right;">ผลสะสม${profile.result_unit ? ` (${escapeHtml(profile.result_unit)})` : ""}</th>
          <th style="${cell}">สถานะ</th>
        </tr>
        ${installmentRows}
      </table>

      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <tr>
          <td style="width:50%;padding:16px 8px;border:none;font-size:11px;text-align:center;color:#555;">
            ลงชื่อ ..............................................<br/>ผู้ควบคุมงาน
          </td>
          <td style="width:50%;padding:16px 8px;border:none;font-size:11px;text-align:center;color:#555;">
            ลงชื่อ ..............................................<br/>ผู้อำนวยการ / ผู้บริหาร
          </td>
        </tr>
      </table>

      <p style="font-size:10px;color:#888;text-align:center;margin-top:8px;">
        เอกสารสร้างอัตโนมัติจากข้อมูล Global State ในระบบ — กรุณาตรวจสอบความถูกต้องก่อนนำเสนอ
      </p>
    </div>
  `;
}

/** สร้างและดาวน์โหลด PDF รายงานสรุปเสนอผู้บริหาร */
export async function downloadExecutiveReportPdf(input: ExecutiveReportInput): Promise<void> {
  if (typeof document === "undefined") return;

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;padding:28px 32px;background:#fff;color:#111;";
  container.innerHTML = buildReportHtml(input);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    const safeName = input.project.name.replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
    pdf.save(`รายงานสรุป_${safeName}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
