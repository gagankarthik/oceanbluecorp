import { ImageResponse } from "next/og";
import { getJob } from "@/lib/aws/dynamodb";

export const runtime = "nodejs";
export const size = { width: 1200, height: 627 };
export const contentType = "image/png";

const JOB_TYPE_MAP: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  "contract": "Contract",
  "contract-to-hire": "Contract-to-Hire",
  "direct-hire": "Direct Hire",
  "managed-teams": "Managed Teams",
  "remote": "Remote",
};

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let jobTitle = "Open Position";
  let jobLocation = "United States";
  let jobType = "Full-time";
  let jobDepartment = "";

  try {
    const result = await getJob(id);
    if (result.success && result.data) {
      const job = result.data;
      jobTitle = job.title || "Open Position";
      jobLocation = job.location || "United States";
      jobType = JOB_TYPE_MAP[job.type] || job.type || "Full-time";
      jobDepartment = job.department || "";
    }
  } catch {
    // fall through to defaults
  }

  const badges = [
    { label: jobLocation },
    { label: jobType },
    ...(jobDepartment ? [{ label: jobDepartment }] : []),
  ];

  const titleSize = jobTitle.length > 50 ? 52 : jobTitle.length > 35 ? 60 : 68;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "627px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f172a",
          padding: "64px 72px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background accent circles */}
        <div style={{
          position: "absolute",
          top: "-120px",
          right: "-80px",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.35) 0%, transparent 70%)",
          display: "flex",
        }} />
        <div style={{
          position: "absolute",
          bottom: "-160px",
          left: "40px",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 70%)",
          display: "flex",
        }} />

        {/* Top: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <div style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              border: "3px solid white",
              display: "flex",
            }} />
          </div>
          <span style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: "20px",
            fontWeight: "600",
            letterSpacing: "0.01em",
          }}>
            Ocean Blue Corporation
          </span>
          <div style={{
            marginLeft: "auto",
            background: "rgba(59,130,246,0.15)",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: "100px",
            padding: "6px 16px",
            color: "#60a5fa",
            fontSize: "15px",
            fontWeight: "600",
            display: "flex",
          }}>
            We&apos;re Hiring
          </div>
        </div>

        {/* Middle: title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
          <div style={{
            fontSize: "15px",
            fontWeight: "600",
            color: "#60a5fa",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}>
            Open Position
          </div>
          <div style={{
            fontSize: `${titleSize}px`,
            fontWeight: "800",
            color: "white",
            lineHeight: "1.1",
            letterSpacing: "-1.5px",
          }}>
            {jobTitle}
          </div>
        </div>

        {/* Bottom: badges + CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap" }}>
          {badges.map(({ label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "100px",
                padding: "10px 20px",
                color: "rgba(255,255,255,0.80)",
                fontSize: "17px",
                fontWeight: "500",
              }}
            >
              {label}
            </div>
          ))}
          <div style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            background: "linear-gradient(135deg, #2563eb, #4f46e5)",
            borderRadius: "12px",
            padding: "14px 28px",
            color: "white",
            fontSize: "19px",
            fontWeight: "700",
            gap: "8px",
          }}>
            Apply Now
            <span style={{ fontSize: "20px" }}>→</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 627 }
  );
}
