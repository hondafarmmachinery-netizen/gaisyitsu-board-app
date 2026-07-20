"use client";

import { useEffect, useState } from "react";
import { getMembers, getStates, updateState } from "@/lib/api";
import { Member, State } from "@/lib/types";

export default function OperationPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [location, setLocation] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    const memberData = await getMembers();
    const stateData = await getStates();
    setMembers(memberData);
    setStates(stateData.states);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdate = async () => {
    if (selectedId === null) return;
    setSavingId(selectedId);
    await updateState(selectedId, location, returnTime);
    await loadData();
    setSavingId(null);
    setLocation("");
    setReturnTime("");
    setSelectedId(null);
  };

  if (loading) {
    return <p className="p-4">読み込み中...</p>;
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">外出状況の更新</h1>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">メンバーを選択</label>
        <select
          className="border rounded p-2 w-full"
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(Number(e.target.value))}
        >
          <option value="">選択してください</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">外出先</label>
        <input
          className="border rounded p-2 w-full"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="例：〇〇会社訪問"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">戻り予定時刻</label>
        <input
          className="border rounded p-2 w-full"
          value={returnTime}
          onChange={(e) => setReturnTime(e.target.value)}
          placeholder="例：15:30"
        />
      </div>

      <button
        className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
        onClick={handleUpdate}
        disabled={selectedId === null || savingId !== null}
      >
        {savingId !== null ? "更新中..." : "更新する"}
      </button>

      <h2 className="text-lg font-bold mt-8 mb-2">現在の状況一覧</h2>
      <ul className="space-y-2">
        {states.map((s) => (
          <li key={s.memberId} className="border rounded p-2">
            <p className="font-semibold">{s.name}</p>
            <p>外出先：{s.location || "（設定なし）"}</p>
            <p>戻り予定：{s.returnTime || "（設定なし）"}</p>
            <p className="text-sm text-gray-500">更新日時：{s.updatedAt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}