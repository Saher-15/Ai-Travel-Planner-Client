import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
} from "../components/UI.jsx";

export default function AdminContacts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingId, setReplyingId] = useState("");

  async function loadMessages() {
    setLoading(true);
    setMsg(null);

    try {
      const { data } = await api.get("/contact/admin/messages");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setMsg({
        type: "error",
        text:
          err?.response?.data?.message ||
          "Failed to load messages",
      });
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id) {
    try {
      await api.patch(`/contact/admin/messages/${id}/read`);
      setItems((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isRead: true } : item
        )
      );
    } catch (err) {
      setMsg({
        type: "error",
        text:
          err?.response?.data?.message ||
          "Failed to mark message as read",
      });
    }
  }

  async function sendReply(id) {
    const adminReply = String(replyDrafts[id] || "").trim();

    if (!adminReply) {
      setMsg({ type: "error", text: "Please write a reply first." });
      return;
    }

    try {
      setReplyingId(id);

      const { data } = await api.patch(`/contact/admin/messages/${id}/reply`, {
        adminReply,
      });

      setItems((prev) =>
        prev.map((item) =>
          item._id === id
            ? {
                ...item,
                adminReply: data?.item?.adminReply || adminReply,
                status: data?.item?.status || "replied",
                repliedAt: data?.item?.repliedAt || new Date().toISOString(),
                isRead: true,
              }
            : item
        )
      );

      setReplyDrafts((prev) => ({ ...prev, [id]: "" }));
      setMsg({ type: "success", text: "Reply saved successfully." });
    } catch (err) {
      setMsg({
        type: "error",
        text:
          err?.response?.data?.message ||
          "Failed to send reply",
      });
    } finally {
      setReplyingId("");
    }
  }

  async function deleteMessage(id) {
    try {
      await api.delete(`/contact/admin/messages/${id}`);
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setMsg({
        type: "error",
        text:
          err?.response?.data?.message ||
          "Failed to delete message",
      });
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Contact Messages"
          subtitle="Admin page for support messages and replies"
          right={
            <Button variant="secondary" onClick={loadMessages} disabled={loading}>
              Refresh
            </Button>
          }
        />
        <CardBody className="space-y-4">
          {msg ? <Alert type={msg.type}>{msg.text}</Alert> : null}

          {loading ? (
            <div className="text-sm text-slate-500">Loading messages...</div>
          ) : items.length === 0 ? (
            <Alert type="info">No contact messages yet.</Alert>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item._id} className="border border-slate-200">
                  <CardBody className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-base font-bold text-slate-900">
                          {item.name}
                        </div>
                        <div className="text-sm text-slate-500">{item.email}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-700">
                          {item.subject}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {item.isRead ? (
                          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                            Read
                          </Badge>
                        ) : (
                          <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                            New
                          </Badge>
                        )}

                        {item.status === "replied" ? (
                          <Badge className="border-sky-200 bg-sky-50 text-sky-700">
                            Replied
                          </Badge>
                        ) : (
                          <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {item.message}
                    </div>

                    {item.adminReply ? (
                      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                          Admin reply
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-700">
                          {item.adminReply}
                        </div>
                        {item.repliedAt ? (
                          <div className="mt-2 text-xs text-slate-500">
                            Replied at {new Date(item.repliedAt).toLocaleString()}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <label className="block">
                      <div className="mb-1.5 text-sm font-semibold text-slate-700">
                        {item.adminReply ? "Update reply" : "Write a reply"}
                      </div>
                      <textarea
                        rows={4}
                        value={replyDrafts[item._id] ?? item.adminReply ?? ""}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({
                            ...prev,
                            [item._id]: e.target.value,
                          }))
                        }
                        placeholder="Write your reply to the user..."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                      />
                    </label>

                    <div className="flex flex-wrap gap-3">
                      {!item.isRead ? (
                        <Button
                          variant="secondary"
                          onClick={() => markAsRead(item._id)}
                        >
                          Mark as Read
                        </Button>
                      ) : null}

                      <Button
                        onClick={() => sendReply(item._id)}
                        disabled={replyingId === item._id}
                      >
                        {replyingId === item._id
                          ? "Saving reply..."
                          : item.adminReply
                          ? "Update Reply"
                          : "Send Reply"}
                      </Button>

                      <Button
                        variant="danger"
                        onClick={() => deleteMessage(item._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}