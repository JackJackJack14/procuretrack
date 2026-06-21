/** เนื้อหา Guideline Box — ขั้นตอนที่ 5 จัดทำและประกาศผู้ชนะการเสนอราคา (อินโฟกราฟิก 3 การ์ด) */

export const STEP5_GUIDELINE_ACTION_ITEMS = [
  "• ดำเนินการจัดทำและบันทึกประกาศผลผู้ชนะการเสนอราคาในระบบ e-GP ของกรมบัญชีกลางให้เรียบร้อย",
  "• พิมพ์ประกาศผลผู้ชนะออกจากระบบ นำไปปิดประกาศโดยเปิดเผย ณ ที่ทำการหน่วยงานของรัฐ (ตาม พ.ร.บ. มาตรา 66)",
  "• ข้อแนะนำระบบ: เมื่อบันทึกประกาศผลเสร็จสิ้น ระบบ e-GP จะจัดส่งอีเมลแจ้งผลการจัดซื้อจัดจ้างไปยังผู้เสนอราคาทุกรายโดยอัตโนมัติ",
] as const;

export const STEP5_GUIDELINE_DURATION_ITEMS = [
  "• ต้องดำเนินการประกาศผลผู้ชนะในระบบ e-GP 'โดยเร็ว' หลังจากหัวหน้าหน่วยงานอนุมัติเห็นชอบผลการพิจารณาจากขั้นตอนก่อนหน้า (ตาม พ.ร.บ. จัดซื้อจัดจ้างฯ มาตรา 66)",
] as const;

export const STEP5_GUIDELINE_WARNING_ITEMS = [
  "• เริ่มนับถอยหลัง 'ระยะเวลาอุทธรณ์ 7 วันทำการ' โดยเริ่มนับวันทำการถัดไปเป็นวันแรก นับจากวันที่ปรากฏในประกาศผลในระบบ e-GP (ตาม พ.ร.บ. มาตรา 117)",
  "• กฎหมายบังคับ 'ห้ามหน่วยงานลงนามในสัญญาหรือข้อตกลงซื้อจ้างก่อนพ้นกำหนดระยะเวลาอุทธรณ์' และไม่มีผู้ใดอุทธรณ์เด็ดขาด (ตาม พ.ร.บ. มาตรา 66 วรรคสอง) หากมีการลงนามก่อนพ้นกำหนด สัญญาจะถือว่าขัดต่อกฎหมายทันที",
] as const;

/** @deprecated ใช้ STEP5_GUIDELINE_ACTION_ITEMS แทน */
export const STEP5_GUIDELINE_TODO = STEP5_GUIDELINE_ACTION_ITEMS;

/** @deprecated ใช้ STEP5_GUIDELINE_DURATION_ITEMS แทน */
export const STEP5_GUIDELINE_DURATION = STEP5_GUIDELINE_DURATION_ITEMS;

/** @deprecated ใช้ STEP5_GUIDELINE_WARNING_ITEMS แทน */
export const STEP5_GUIDELINE_WARNINGS = STEP5_GUIDELINE_WARNING_ITEMS;
