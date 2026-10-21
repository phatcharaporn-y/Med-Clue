"use client";

import Link from "next/link";
import { useRef } from "react";

const activities = [
  {
    icon: "/images/icon/book.png",
    title: "HOW TO PLAY",
    subtitle: "เรียนรู้วิธีการเล่นและ Game Guide",
    href: "/lessons",
    tone: "blue",
  },
  {
    icon: "/images/icon/learning%20zone%20book.png",
    title: "LEARNING ZONE",
    subtitle: "ทบทวนความรู้ก่อนเข้าสู่ Simulation",
    href: "/lessons",
    tone: "violet",
  },
  {
    icon: "/images/icon/joygame.png",
    title: "START MISSION",
    subtitle: "พร้อมแล้วไปฝึกสถานการณ์จำลอง",
    href: "/game",
    tone: "cyan",
  },
];

const missions = [
  { n: 1, state: "done", label: "สำเร็จ!" },
  { n: 2, state: "progress", label: "96%" },
  { n: 3, state: "current", label: "รอดำเนินการ" },
  { n: 4, state: "locked", label: "" },
  { n: 5, state: "locked", label: "" },
  { n: 6, state: "locked", label: "" },
  { n: 7, state: "locked", label: "" },
  { n: 8, state: "locked", label: "" },
  { n: 9, state: "locked", label: "" },
];

function HomeIcon({ name }: { name: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (name === "home")
    return (
      <svg {...common}>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z" />
      </svg>
    );
  if (name === "book")
    return (
      <svg {...common}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" />
        <path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20" />
      </svg>
    );
  if (name === "target")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <path d="m12 12 7-7m-3 0h3v3" />
      </svg>
    );
  if (name === "history")
    return (
      <svg {...common}>
        <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" />
        <path d="M3 3v5h5m4-1v5l3 2" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

export default function Home() {
  const missionTrackRef = useRef<HTMLDivElement>(null);

  function scrollMissions(direction: -1 | 1) {
    missionTrackRef.current?.scrollBy({
      left: direction * 140,
      behavior: "smooth",
    });
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="MedClue หน้าหลัก">
          <span>MED</span> CLUE
        </Link>
        <nav className="side-nav" aria-label="เมนูหลัก">
          <Link className="nav-link active" href="/">
            <HomeIcon name="home" />
            <span>หน้าแรก</span>
          </Link>
          <Link className="nav-link" href="/lessons">
            <HomeIcon name="book" />
            <span>โซนเรียนรู้</span>
          </Link>
          <Link className="nav-link" href="/game">
            <HomeIcon name="target" />
            <span>เล่น Simulation</span>
          </Link>
          <Link className="nav-link" href="/game">
            <HomeIcon name="history" />
            <span>ประวัติของฉัน</span>
          </Link>
          <Link className="nav-link" href="/lessons">
            <HomeIcon name="check" />
            <span>แบบทดสอบ</span>
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-profile">
            <span className="avatar-small">พ</span>
            <div>
              <strong>พัชพร อยู่ดีมี</strong>
              <small>นักศึกษาคณะพยาบาลชั้นปีที่ 2</small>
            </div>
          </div>
          <Link className="logout-link" href="/">
            ↪ <span>ออกจากระบบ</span>
          </Link>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>MedClue</span>
            <b>/</b>
            <strong>หน้าแรก</strong>
          </div>
          <button className="profile-button" aria-label="โปรไฟล์">
            พ
          </button>
        </header>
        <main className="dashboard-content">
          <section className="welcome-row">
            <div>
              <p className="welcome-kicker">
                วันอังคาร · พร้อมเรียนรู้หรือยัง?
              </p>
              <h1>
                สวัสดี, พัชพร <span>✦</span>
              </h1>
              <p className="welcome-copy">
                เดินหน้าฝึกทักษะการพยาบาลของคุณต่อได้เลย
              </p>
            </div>
          </section>

          <section className="overview-grid" aria-label="ภาพรวมการเรียน">
            <article className="progress-banner">
              <div className="progress-emblem">
                <img src="/images/icon/logo.png" alt="MedClue" />
              </div>
              <div className="progress-copy">
                <span className="section-kicker">YOUR JOURNEY</span>
                <h2>ความคืบหน้าของฉัน</h2>
                <p>ทุกบทเรียนพาคุณเข้าใกล้เป้าหมายอีกขั้น</p>
                <div className="progress-track">
                  <span />
                </div>
              </div>
              <div className="progress-number">
                <strong>2</strong>
                <span>/ 9</span>
                <small>บทเรียนที่ผ่านแล้ว</small>
              </div>
              <div className="progress-sparkle">🏆</div>
            </article>
            <article className="student-card">
              <div className="student-avatar"><img src="/images/icon/nurse.png" alt="" /></div>
              <div>
                <span className="section-kicker">STUDENT PROFILE</span>
                <h2>พัชพร อยู่ดีมี</h2>
                <p>นักศึกษาพยาบาลชั้นปีที่ 2</p>
                <small>
                  รหัสนักศึกษา <strong>670000000-0</strong>
                </small>
              </div>
             
            </article>
          </section>

          <section className="activity-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">CHOOSE YOUR PATH</span>
                <h2>เริ่มต้นการเรียนรู้</h2>
              </div>
              <Link href="/lessons">
                ดูบทเรียนทั้งหมด <span>→</span>
              </Link>
            </div>
            <div className="activity-grid">
              {activities.map((activity, i) => (
                <article
                  className={`activity-card ${activity.tone}`}
                  key={activity.title}
                >
                  <div className="activity-top">
                    <span className="activity-number">0{i + 1}</span>
                    <span className="activity-icon">
                      <img src={activity.icon} alt="" />
                    </span>
                  </div>
                  <div className="activity-info">
                    <h3>{activity.title}</h3>
                    <p>{activity.subtitle}</p>
                    <Link href={activity.href}>
                      เริ่มเลย <span>→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="missions-panel">
            <div className="section-heading">
              <div>
                <span className="section-kicker">MISSION TRACKER</span>
                <h2>ภารกิจของฉัน</h2>
              </div>
              <div className="mission-actions">
                <button
                  type="button"
                  onClick={() => scrollMissions(-1)}
                  aria-label="เลื่อนภารกิจไปทางซ้าย"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => scrollMissions(1)}
                  aria-label="เลื่อนภารกิจไปทางขวา"
                >
                  →
                </button>
              </div>
            </div>
            <div className="mission-viewport" ref={missionTrackRef}>
              <div className="mission-track">
                {missions.map((mission, index) => (
                  <div
                    className={`mission-step ${mission.state}`}
                    key={mission.n}
                  >
                    <div className="mission-node">
                      {mission.state === "done" ? (
                        "✓"
                      ) : mission.state === "progress" ? (
                        <span className="mission-dots">
                          <i />
                          <i />
                          <i />
                        </span>
                      ) : mission.state === "current" ? (
                        "★"
                      ) : (
                        "♙"
                      )}
                    </div>
                    <div className="mission-caption">ภารกิจที่ {mission.n}</div>
                    {mission.label && <small>{mission.label}</small>}
                    {index < missions.length - 1 && (
                      <span className="mission-connector" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
        <footer className="dashboard-footer">
          <div className="footer-brand">
            <Link href="/">
              <span>MED</span> CLUE
            </Link>
            <p>เรียนรู้ • ฝึกฝน • เติบโตไปด้วยกัน</p>
          </div>
          <div className="footer-links">
            <div>
              <b>เมนูแนะนำ</b>
              <Link href="/lessons">โซนเรียนรู้</Link>
              <Link href="/game">เริ่ม Simulation</Link>
            </div>
            <div>
              <b>ช่วยเหลือ</b>
              <Link href="/lessons">วิธีการใช้งาน</Link>
              <Link href="/lessons">ติดต่อเรา</Link>
            </div>
            <div className="footer-note">
              <b>MEDCLUE</b>
              <p>
                แพลตฟอร์มฝึกทักษะ
                <br />
                สำหรับนักศึกษาพยาบาล
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© MedClue 2026 · สงวนลิขสิทธิ์</span>
            <span>Terms & Conditions　　Privacy Policy</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
