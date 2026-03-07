import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../api/client";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
} from "../components/UI.jsx";

export default function Profile() {
  const nav = useNavigate();
  const { user, logout } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState(null);

  const [supportItems, setSupportItems] = useState([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState("");

  const showMessage = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  function isStrongPassword(pw) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      pw
    );
  }

  async function loadMySupportMessages() {
    setSupportLoading(true);
    setSupportError("");

    try {
      const { data } = await api.get("/contact/my/messages");
      setSupportItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setSupportError(
        err?.response?.data?.message || "Failed to load your support messages."
      );
    } finally {
      setSupportLoading(false);
    }
  }

  useEffect(() => {
    loadMySupportMessages();
  }, []);

  const onChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showMessage("Please fill in all password fields.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("New passwords do not match.", "error");
      return;
    }

    if (!isStrongPassword(newPassword)) {
      showMessage(
        "Password must be 8+ characters and include uppercase, lowercase, number, and special character.",
        "error"
      );
      return;
    }

    try {
      await api.post("/auth/change-password", {
        oldPassword,
        newPassword,
      });

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      showMessage("Password changed successfully.");
    } catch (err) {
      showMessage(err.response?.data?.message || "Password change failed.", "error");
    }
  };

  const onResendVerification = async () => {
    try {
      const { data } = await api.post("/auth/resend-verification");
      showMessage(data.message || "Verification email sent.");
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to resend email.", "error");
    }
  };

  const onLogout = async () => {
    await logout();
    nav("/login");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 text-white">
            <Badge className="border-white/20 bg-white/15 text-white">
              Account
            </Badge>

            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
              Profile & settings
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/90">
              Manage your account details, security, and verification settings for
              your travel planner experience.
            </p>

            <div className="mt-6 grid gap-3">
              <InfoCard
                title="Account information"
                text="Your profile details are shown here for reference and account identity."
              />
              <InfoCard
                title="Password security"
                text="Keep your account secure by using a strong password and updating it when needed."
              />
              <InfoCard
                title="Support replies"
                text="Messages from admin support will appear below in your profile."
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-7">
        <Card>
          <CardHeader
            title="Your profile"
            subtitle="View your account information and manage security settings"
          />

          <CardBody className="space-y-6">
            {msg ? <Alert type={msg.type === "error" ? "error" : "success"}>{msg.text}</Alert> : null}

            {!user?.verified && (
              <Alert type="warning" className="space-y-3">
                <div className="font-semibold">Your email is not verified.</div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={onResendVerification}>Resend Verification Email</Button>
                </div>
              </Alert>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-slate-900">
                    Profile information
                  </div>
                  <div className="text-sm text-slate-500">
                    These details are currently read-only
                  </div>
                </div>

                <Badge>{user?.verified ? "Verified" : "Unverified"}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Name"
                  value={user?.name || ""}
                  readOnly
                  className="bg-slate-50 text-slate-600"
                />

                <Input
                  label="Email"
                  value={user?.email || ""}
                  readOnly
                  className="bg-slate-50 text-slate-600"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-4">
                <div className="text-base font-bold text-slate-900">
                  Change password
                </div>
                <div className="text-sm text-slate-500">
                  Use a strong password to protect your account
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="Enter your current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />

                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button variant="primary" onClick={onChangePassword}>
                    Update Password
                  </Button>

                  <div className="text-xs text-slate-500">
                    Must include uppercase, lowercase, number, and special character.
                  </div>
                </div>
              </div>
            </div>

            <Card className="border border-slate-200">
              <CardHeader
                title="My support messages"
                subtitle="Replies from admin will appear here"
                right={
                  <Button variant="secondary" onClick={loadMySupportMessages} disabled={supportLoading}>
                    Refresh
                  </Button>
                }
              />
              <CardBody className="space-y-4">
                {supportError ? <Alert type="error">{supportError}</Alert> : null}

                {supportLoading ? (
                  <div className="text-sm text-slate-500">Loading support messages...</div>
                ) : supportItems.length === 0 ? (
                  <Alert type="info">You have not sent any support messages yet.</Alert>
                ) : (
                  <div className="space-y-4">
                    {supportItems.map((item) => (
                      <div
                        key={item._id}
                        className="rounded-3xl border border-slate-200 bg-white p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="text-base font-bold text-slate-900">
                              {item.subject}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              Sent on {new Date(item.createdAt).toLocaleString()}
                            </div>
                          </div>

                          {item.status === "replied" ? (
                            <Badge className="border-sky-200 bg-sky-50 text-sky-700">
                              Replied
                            </Badge>
                          ) : (
                            <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                              Pending
                            </Badge>
                          )}
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Your message
                          </div>
                          <div className="mt-2 text-sm leading-6 text-slate-700">
                            {item.message}
                          </div>
                        </div>

                        {item.adminReply ? (
                          <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                              Admin reply
                            </div>
                            <div className="mt-2 text-sm leading-6 text-slate-700">
                              {item.adminReply}
                            </div>
                            {item.repliedAt ? (
                              <div className="mt-2 text-xs text-slate-500">
                                Replied on {new Date(item.repliedAt).toLocaleString()}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="danger" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <div className="text-sm font-bold text-white">{title}</div>
      <div className="mt-1 text-sm leading-6 text-white/85">{text}</div>
    </div>
  );
}