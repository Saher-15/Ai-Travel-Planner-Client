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
          subtitle="Admin page for support messages"
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
                  <CardBody className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-base font-bold text-slate-900">
                          {item.name}
                        </div>
                        <div className="text-sm text-slate-500">{item.email}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.isRead ? (
                          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                            Read
                          </Badge>
                        ) : (
                          <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {item.message}
                    </div>

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