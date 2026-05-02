const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendWeeklyDigest = async ({ to, name, stats, todos, subjects }) => {
  const { studyHours, totalKm, workoutDays, doneTodos, pendingTodos } = stats;

  // Build subject progress rows
  const subjectRows = subjects.map((s) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${s.color};margin-right:8px;"></span>
        ${s.name}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">
        ${s.completionPercent}%
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

        <!-- Header -->
        <div style="background:#6366f1;padding:32px;text-align:center;">
          <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
            <span style="color:white;font-size:24px;font-weight:bold;">D</span>
          </div>
          <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">Weekly Digest</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">
            Great work this week, ${name}!
          </p>
        </div>

        <!-- Stats -->
        <div style="padding:24px 32px;">
          <h2 style="font-size:14px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 16px;">
            This week's summary
          </h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            ${[
              { label: 'Study hours',  value: `${studyHours}h`,        color: '#6366f1' },
              { label: 'Km run',       value: `${totalKm} km`,         color: '#10b981' },
              { label: 'Workout days', value: `${workoutDays} days`,   color: '#f59e0b' },
              { label: 'Tasks done',   value: `${doneTodos} tasks`,    color: '#6366f1' },
            ].map(({ label, value, color }) => `
              <div style="background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #e2e8f0;">
                <p style="margin:0;font-size:22px;font-weight:700;color:${color};">${value}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">${label}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Pending tasks -->
        ${pendingTodos > 0 ? `
        <div style="padding:0 32px 24px;">
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;">
            <p style="margin:0;font-size:14px;color:#c2410c;font-weight:600;">
              ⚠️ ${pendingTodos} task${pendingTodos > 1 ? 's' : ''} still pending
            </p>
            <p style="margin:4px 0 0;font-size:13px;color:#9a3412;">
              Don't forget to check your to-do list this week.
            </p>
          </div>
        </div>
        ` : `
        <div style="padding:0 32px 24px;">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;">
            <p style="margin:0;font-size:14px;color:#15803d;font-weight:600;">
              ✅ All tasks completed — great job!
            </p>
          </div>
        </div>
        `}

        <!-- Subjects -->
        ${subjects.length > 0 ? `
        <div style="padding:0 32px 24px;">
          <h2 style="font-size:14px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">
            Syllabus progress
          </h2>
          <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
            ${subjectRows}
          </table>
        </div>
        ` : ''}

        <!-- CTA -->
        <div style="padding:0 32px 32px;text-align:center;">
          
            href="${process.env.CLIENT_URL || 'http://localhost:5173'}"
            style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;"
          >
            View your dashboard →
          </a>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            Daily Tracker · Weekly digest sent every Sunday
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to,
    subject: `📊 Your weekly digest — ${name}`,
    html,
  });
};

module.exports = { sendWeeklyDigest };