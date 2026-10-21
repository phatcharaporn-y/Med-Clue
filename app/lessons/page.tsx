import { createSupabaseClient } from "../../lib/supabase";

export const dynamic = "force-dynamic";

type LessonRecord = Record<string, unknown>;

export default async function LessonsPage() {
  const hasConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  let lessons: LessonRecord[] = [];
  let message = "";

  if (!hasConfig) {
    message = "ยังไม่ได้ตั้งค่า Supabase ในไฟล์ .env.local";
  } else {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.from("lessons").select("*").limit(10);

      if (error) {
        message = "ดึงข้อมูลไม่ได้ ตรวจว่ามีตาราง lessons และเปิดสิทธิ์อ่านข้อมูลแล้ว";
      } else {
        lessons = (data ?? []) as LessonRecord[];
        if (lessons.length === 0) message = "ยังไม่มีข้อมูลบทเรียนในตาราง lessons";
      }
    } catch {
      message = "เชื่อมต่อ Supabase ไม่สำเร็จ ตรวจสอบค่า URL และ publishable key";
    }
  }

  return (
    <main className="game-page">
      <header className="game-header">
        <a href="/">MedClue</a>
        <a href="/game">ไปหน้าเกม</a>
      </header>
      <section className="game-card">
        <p className="eyebrow">SUPABASE · LESSONS</p>
        <h1>บทเรียน</h1>
        <p className="scenario">ตัวอย่างการ query ข้อมูล 10 รายการจากตาราง lessons</p>
        {message ? (
          <p className="feedback retry" role="status">{message}</p>
        ) : (
          <div className="lesson-list">
            {lessons.map((lesson, index) => (
              <article className="lesson-item" key={String(lesson.id ?? index)}>
                {Object.entries(lesson).map(([field, value]) => (
                  <p key={field}>
                    <strong>{field}:</strong>{" "}
                    {typeof value === "string" ? value : JSON.stringify(value) ?? String(value)}
                  </p>
                ))}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
