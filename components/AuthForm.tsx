"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import styles from "./AuthForm.module.css";

type Mode = "login" | "signup";

export default function AuthForm() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    setBusy(true);

    try {
      if (mode === "signup") {
        const firstName = String(formData.get("firstName") ?? "").trim();
        const lastName = String(formData.get("lastName") ?? "").trim();
        const studentId = String(formData.get("studentId") ?? "").trim();
        const confirmation = String(formData.get("confirmPassword") ?? "");

        if (password !== confirmation) {
          setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
          return;
        }
        if (!firstName || !lastName || !studentId) {
          setError("กรุณากรอกชื่อ นามสกุล และรหัสนักศึกษาให้ครบ");
          return;
        }

        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName, last_name: lastName, student_id: studentId },
          },
        });

        if (signupError) throw signupError;
        if (data.session) {
          router.replace("/");
          router.refresh();
        } else {
          setError("สมัครบัญชีแล้วแต่ยังเข้าสู่ระบบไม่ได้ กรุณาปิด Confirm email ใน Supabase Dashboard แล้วลองอีกครั้ง");
        }
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;

        const requestedNext = new URLSearchParams(window.location.search).get("next") ?? "/";
        const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
          ? requestedNext
          : "/";
        router.replace(next);
        router.refresh();
      }
    } catch (submissionError) {
      const text = submissionError instanceof Error ? submissionError.message : "เกิดข้อผิดพลาด กรุณาลองใหม่";
      setError(text.includes("users_student_id_unique") || text.includes("duplicate key")
        ? "รหัสนักศึกษานี้ถูกใช้สมัครแล้ว"
        : text.includes("users") || text.includes("Database error")
        ? "บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจตาราง users และ trigger ใน Supabase"
        : text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <a href="/login" className={styles.brand}><span>MED</span> CLUE</a>
        <p className={styles.eyebrow}>MEDCLUE LEARNING PLATFORM</p>
        <h1>{mode === "login" ? "ยินดีต้อนรับกลับ" : "สร้างบัญชีผู้เรียน"}</h1>
        <p className={styles.intro}>เข้าสู่ระบบเพื่อเรียนรู้และฝึกสถานการณ์จำลองของคุณ</p>

        <div className={styles.tabs} role="tablist" aria-label="เข้าสู่ระบบหรือสมัครสมาชิก">
          <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? styles.activeTab : ""} onClick={() => { setMode("login"); setError(""); setMessage(""); }}>เข้าสู่ระบบ</button>
          <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? styles.activeTab : ""} onClick={() => { setMode("signup"); setError(""); setMessage(""); }}>สมัครสมาชิก</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <div className={styles.nameRow}>
                <label>ชื่อ<input name="firstName" autoComplete="given-name" required minLength={2} /></label>
                <label>นามสกุล<input name="lastName" autoComplete="family-name" required minLength={2} /></label>
              </div>
              <label>รหัสประจำตัวนักศึกษา<input name="studentId" autoComplete="off" required /></label>
            </>
          )}
          <label>อีเมล<input name="email" type="email" autoComplete="email" required /></label>
          <label>รหัสผ่าน<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} /></label>
          {mode === "signup" && <label>ยืนยันรหัสผ่าน<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} /></label>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {message && <p className={styles.success} role="status">{message}</p>}
          <button className={styles.submit} type="submit" disabled={busy}>
            {busy ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}
          </button>
        </form>
        <p className={styles.privacy}>รหัสผ่านจัดการโดย Supabase Auth และไม่ถูกเก็บในตารางโปรไฟล์</p>
      </section>
    </main>
  );
}
