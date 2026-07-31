# CODEX SYSTEM RULES — ProcureTrack

> **ใช้เป็น System Prompt / Instructions บังคับสำหรับ AI ทุกตัวที่เข้ามาแก้โค้ดโปรเจกต์นี้ (Codex / ChatGPT / อื่นๆ)**
>
> อ่านคู่กับ: `HANDOVER_CODEX.md` (บริบทและสถาปัตยกรรม) และ `project-rules.md` (audit + กฎเดิม)
>
> **ห้ามแก้โค้ดก่อนอ่านไฟล์นี้จบ** — กฎทั้งหมดนี้มีผลเหนือความสะดวกในการเขียนโค้ด

---

## ⚖️ ProcureTrack System Golden Rules (กฎเหล็ก 5 ข้อ)

### RULE 1 — Compliance First (ระเบียบมาก่อนเสมอ)

ทุกฟังก์ชัน ทุกการคำนวณ ทุก validation **ต้องสอดคล้องกับ**:

- **พ.ร.บ. การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560**
- **ระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560**

ข้อบังคับปฏิบัติ:

- ห้ามสร้างตรรกะที่ทำให้ผู้ใช้ "ข้าม" ข้อบังคับตามระเบียบ เพื่อความสะดวกของ UI
- เมื่อระเบียบขัดกับความต้องการด้าน UX → **ระเบียบชนะ** แล้วออกแบบ UX ให้อธิบายเหตุผลแทน
- ทุก validation rule ที่อ้างระเบียบ ต้องมี **คอมเมนต์ระบุข้อ** เช่น `// ระเบียบฯ ข้อ 185`
- ถ้าไม่แน่ใจว่าระเบียบกำหนดอย่างไร → **หยุดและถามผู้ใช้** ห้ามเดาแล้วเขียนตรรกะลงไป

---

### RULE 2 — Strict Gatekeeping & Data Consistency (ประตูกั้นต้องแน่น)

**ปุ่ม "ปิดโครงการ" ห้ามกดได้** จนกว่าจะครบทุกเงื่อนไข:

1. **ทุกงวดงาน** มีสถานะ **`payment_completed` (จ่ายเงินแล้ว)**
2. **เอกสารบังคับครบ 100%** ทุกงวด (หนังสือส่งมอบ / ใบตรวจรับ / รายงานผู้ควบคุมงาน กรณีก่อสร้าง)
3. จำนวนแถวงวดงานต้องตรงกับ `total_installment_count` จาก Step 9

อ้างอิงโค้ดจริง (ห้ามเขียนตรรกะซ้ำที่อื่น):

```ts
// src/lib/step10-contract.ts
canArchiveStep10Project(rows, uploadedTypes, projectType, totalInstallmentCount)
canAdvanceStep10PaymentStatus(...)
step10RowHasRequiredDocs(installmentNo, uploadedTypes, projectType)
```

ลำดับสถานะเบิกจ่ายที่ห้ามข้าม:

```
awaiting_inspection → inspection_completed → payment_submitted → payment_completed
```

**Data Consistency:** ข้อมูลที่สืบทอดข้ามขั้น (มูลค่าสัญญา, จำนวนงวด, ระยะรับประกัน, คณะกรรมการตรวจรับ) ต้องมี **แหล่งความจริงเดียว (single source of truth)** — ห้าม hardcode หรือให้ผู้ใช้กรอกซ้ำในขั้นถัดไป

---

### RULE 3 — Strict UX/UI Validation (ห้าม Disable ปุ่ม)

**ห้ามใส่ `disabled` บนปุ่มดำเนินการ/บันทึก/ไปขั้นถัดไป เพราะข้อมูลไม่ครบ**

เหตุผล: ปุ่มเทาไม่บอกผู้ใช้ว่าขาดอะไร → ผู้ใช้ติดค้างโดยไม่รู้สาเหตุ

รูปแบบที่ถูกต้อง:

1. ปุ่ม **กดได้เสมอ** (ยกเว้น `readOnly` / กำลังบันทึกอยู่)
2. เมื่อกดแล้วข้อมูลไม่ครบ → รัน compliance check
3. แสดง **Inline Error สีแดง** ใต้ช่องที่ผิด (`text-destructive`, `role="alert"`)
4. **Scroll to error** ไปยังช่องแรกที่ผิดอัตโนมัติ

ใช้ helper ที่มีอยู่แล้ว — ห้ามเขียน scroll เอง:

```ts
// src/lib/compliance-scroll.ts
scrollToComplianceError(issueId, docType?)
scrollToComplianceErrorAfterPaint(issueId, docType?)
scrollToMissingDocUpload(documentType)
// ผูกช่องกรอกด้วย data-compliance-target="<fieldId>"
```

ข้อกำหนดข้อความ error:

- ต้องเป็น **ภาษาไทย** และบอกวิธีแก้ ไม่ใช่แค่ "ข้อมูลไม่ถูกต้อง"
- error ที่มาจากระเบียบ ควรอ้างข้อ เช่น `❌ ... (ระเบียบฯ ข้อ 185)`

---

### RULE 4 — Date Integrity (วันที่ต้องคำนวณ ห้ามพิมพ์มือ)

**การคำนวณวันส่งมอบ / วันครบกำหนด / ค่าปรับ ต้องคำนวณอัตโนมัติบนฐาน "วันปฏิทิน" (Calendar Days) รวมวันหยุด**

ข้อบังคับ:

- ช่องวันที่ที่เป็นผลลัพธ์การคำนวณ ต้องเป็น **read-only / auto-fill** — ห้ามให้ผู้ใช้พิมพ์เอง
- **ค่าปรับ** = คิดจาก **วันปฏิทิน** เท่านั้น (รวมเสาร์-อาทิตย์และวันหยุดราชการ)
- **วันทำการ (Workdays)** ใช้เฉพาะกรณีที่ระเบียบระบุชัด เช่น กรอบเวลาตรวจรับ (ข้อ 178), ระยะเผยแพร่ประกาศ
- วันที่แสดงบน UI = **พ.ศ.**, วันที่เก็บใน DB/API = **ISO ค.ศ. (yyyy-mm-dd)**

ใช้ helper ที่มีอยู่ — ห้ามเขียน date math เอง:

```ts
// src/lib/workdays.ts        → addWorkdays, countWorkdaysBetweenISO, isThaiHoliday
// src/lib/step-form.ts       → addCalendarDaysISO
// src/lib/step7-lg-expiry.ts → addCalendarYearsISO
// src/lib/step10-contract.ts → computeStep10InstallmentPenalty (calendar days)
// src/lib/thai-date.ts       → formatThaiDate, formatThaiDateHint, toGregorianISODate
```

Chronological chain (วันที่ห้ามย้อนหลังข้ามขั้น) ต้องผ่าน:

```
src/lib/chronological-date-chains.ts
src/lib/chronological-date-validator.ts
src/components/ChronologicalDatePicker.tsx
```

---

### RULE 5 — Non-Destructive Refactoring (ห้ามทำลายของเดิม)

**ห้ามลบ ล้าง หรือทำลาย State Management และ Database Schema เดิมที่ต่อท่อไว้เด็ดขาด**

ข้อห้ามเด็ดขาด:

- ❌ ลบ / เปลี่ยนชื่อ field ใน `Step1Profile` … `Step10FormData` โดยไม่มี migration + backward-compat
- ❌ ลบคอลัมน์หรือ drop table ใน Supabase
- ❌ ล้าง state ที่ parent (`projects_.$projectId.tsx`) ส่งลง child component
- ❌ เปลี่ยนโครงสร้าง JSON ใน `procurement_steps.note` (`__STEP_FORM__:`) แบบ breaking
- ❌ เพิ่มคอลัมน์ใหม่ในตาราง `projects` โดยไม่ได้รับอนุญาต (ตาม `project-rules.md`)

สิ่งที่ต้องทำแทน:

- เพิ่ม field ใหม่แบบ **optional** พร้อม default
- ข้อมูลฟอร์มย่อยเก็บใน **JSON ใน `note`** ของ `procurement_steps` ขั้นนั้น
- ถ้าจำเป็นต้องเปลี่ยนความหมายของ field เดิม → เขียน **normalize / migrate function** เช่น `migrateStep7ContractDurationDays`, `normalizeStep10ContractAmendment`
- Mark ของเก่าเป็น `@deprecated` แทนการลบ
- **ทุกครั้งหลังแก้: รัน `npm run build` ให้ผ่านก่อนรายงานว่าเสร็จ**

---

## 📜 RULE 6 — Procurement Rules (ระเบียบพัสดุที่ต้องบังคับใช้)

ทั้งหมดนี้ implement แล้วในโค้ด — เมื่อแก้ไข ต้องรักษาพฤติกรรมนี้ไว้

### ข้อ 162 — ฐานค่าปรับงานก่อสร้าง

- **งานก่อสร้าง:** ค่าปรับคิดจาก **วงเงินรวมทั้งสัญญา** (ห้ามใช้วงเงินรายงวด)
- **ซื้อ/จ้างทั่วไป:** คิดจากวงเงินเฉพาะงวดนั้น (วงเงินสัญญา ÷ จำนวนงวด)
- อัตราก่อสร้าง: clamp ระหว่าง min–max และมี **ขั้นต่ำ 100 บาท/วัน**
- นอกจากนี้ ข้อ 162 ยังคุมกรอบ **ประกาศสาระสำคัญสัญญาใน e-GP ภายใน 15 วันปฏิทิน** นับจากวันลงนาม (Step 9)

```ts
// src/lib/step10-contract.ts
getStep10PenaltyBaseAmount({ projectType, contractAmount, totalInstallments })
computeStep10InstallmentPenalty({ ... })
// src/lib/step10-guideline.ts
STEP10_PENALTY_RATE_CONSTRUCTION_MIN / _MAX
STEP10_CONSTRUCTION_MIN_PENALTY_PER_DAY_BAHT = 100
```

### ข้อ 176 — รายงานผู้ควบคุมงาน

- **งานก่อสร้าง:** คณะกรรมการตรวจรับต้องใช้ **รายงานผลการปฏิบัติงานของผู้ควบคุมงาน** ประกอบการตรวจรับ **ทุกงวด**
- ต้อง **แนบ PDF รายงานผู้ควบคุมงาน** + ติ๊กยืนยันตรวจสอบแล้ว ก่อนส่งเรื่องเบิกจ่าย
- เอกสารบังคับต่อ งวด: หนังสือส่งมอบงาน, ใบตรวจรับ, (ก่อสร้าง) รายงานผู้ควบคุมงาน

```ts
STEP10_SUPERVISOR_REPORT_VERIFIED_LABEL
getStep10InstallmentDocChecklist(installmentNo, uploadedTypes, projectType)
// row.supervisor_report_verified ต้องเป็น true ก่อน payment_submitted
```

### ข้อ 178 — กรอบเวลาตรวจรับ 5 วันทำการ

- คณะกรรมการตรวจรับต้องดำเนินการให้เสร็จภายใน **5 วันทำการ** นับจากวันที่ได้รับมอบงาน
- ใช้เป็น **กรอบเวลาการทำงาน / แจ้งเตือน** เท่านั้น — **ไม่ใช่ฐานคำนวณค่าปรับ**
- นับด้วย **วันทำการ** (`workdays.ts`) ไม่ใช่วันปฏิทิน

### ข้อ 182 — แก้ไขสัญญา

- **สัญญาแก้ไข (ขยายเวลา) ต้องลงนามก่อนวันสิ้นสุดสัญญาเดิม**
- วันลงนามแก้ไขสัญญาต้องอยู่ในช่วง: ไม่ก่อนวันเริ่มสัญญา และ **ไม่เกินวันสิ้นสุดสัญญาเดิม**
- ทุกครั้งที่แก้ไขสัญญา ต้อง **แนบเอกสารอนุมัติ (PDF)** ผูกกับ `amendment.id` เพื่อ audit trail
- การปรับ **Adjusted Date** ของงวดงาน ทำได้เฉพาะเมื่ออ้างอิง amendment ที่มีเอกสารแล้ว

```ts
step10AmendmentMinSigningDate(...)
step10AmendmentMaxSigningDate(...)   // ≤ วันสิ้นสุดสัญญาเดิม
isStep10AmendmentSigningDateOutOfBounds(...)
resolveStep10AmendmentApprovalDocType(amendment, sequenceNo)
```

### ข้อ 185 — ค้ำประกันความชำรุดบกพร่อง ≥ 2 ปี

- ระยะค้ำประกันความชำรุดบกพร่อง **ไม่น้อยกว่า 2 ปีปฏิทิน**
- นับจาก **วันตรวจรับงวดสุดท้าย** → `projects.warranty_started_at`
- สิ้นสุดที่ `projects.warranty_end_date` (+N ปีปฏิทิน) และ project `status = "warranty"`
- **หลักประกันผลงาน (BG)** ต้องมีอายุครอบคลุมถึงวันสิ้นสุดค้ำประกัน มิฉะนั้นต้องเตือน error

```ts
STEP10_DEFECT_WARRANTY_YEARS_MIN = 2
normalizeStep10DefectWarrantyYears(years)   // clamp ขั้นต่ำ 2
isStep10BgExpiryShortOfWarranty(bgExpiryISO, warrantyEndISO)
computeStep10WarrantyReturnReminderISO(warrantyEndISO, daysBefore = 30)
```

---

## ✅ Checklist ก่อนรายงานว่า "เสร็จแล้ว"

ต้องผ่านทุกข้อ ห้ามข้าม:

- [ ] ตรรกะสอดคล้องระเบียบ และมีคอมเมนต์อ้างข้อที่เกี่ยวข้อง (RULE 1, 6)
- [ ] ไม่มีปุ่มไหนถูก `disabled` เพราะข้อมูลไม่ครบ — ใช้ inline error + scroll แทน (RULE 3)
- [ ] วันที่ผลลัพธ์คำนวณอัตโนมัติ ไม่ให้พิมพ์มือ และใช้ helper กลาง (RULE 4)
- [ ] ไม่ลบ/เปลี่ยน schema, state, หรือโครงสร้าง note JSON เดิม (RULE 5)
- [ ] Gate ปิดโครงการยังบังคับ "จ่ายเงินแล้วทุกงวด + เอกสารครบ" (RULE 2)
- [ ] **`npm run build` ผ่าน**
- [ ] ตรวจ lint ของไฟล์ที่แก้ ไม่มี error ใหม่

---

## 🚫 สิ่งที่ห้ามทำ (Quick Reference)

| ห้าม | ให้ทำแทน |
|------|-----------|
| `disabled={!isValid}` บนปุ่มดำเนินการ | กดได้ + inline error + scroll to error |
| คำนวณค่าปรับด้วยวันทำการ | ใช้วันปฏิทิน (`countCalendarDaysBetweenISO`) |
| ให้ผู้ใช้พิมพ์วันครบกำหนดเอง | auto-fill read-only จากการคำนวณ |
| ลบ field / คอลัมน์เดิม | mark `@deprecated` + normalize function |
| เพิ่มคอลัมน์ใน `projects` ตามใจ | เก็บใน `procurement_steps.note` JSON |
| hardcode วันที่หรือจำนวนเงินในข้อความ | สร้างจากค่าที่คำนวณจริง |
| ปิดโครงการได้ทั้งที่ยังไม่จ่ายครบ | บังคับ `canArchiveStep10Project` |
| เดาระเบียบเมื่อไม่แน่ใจ | หยุดถามผู้ใช้ก่อน |

---

*ไฟล์นี้เป็นกฎบังคับ ไม่ใช่คำแนะนำ — หากการแก้ไขใดขัดกับกฎข้อใดข้อหนึ่ง ให้แจ้งผู้ใช้และขอการยืนยันก่อนดำเนินการ*
