'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const [department, setDepartment] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [interval, setInterval] = useState('');
  const [lastAccidentDate, setLastAccidentDate] = useState('');
  const [weatherSource, setWeatherSource] = useState('');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    let iconUrl = '';

    if (iconFile) {
      const filePath = `icons/${Date.now()}_${iconFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('icon')
        .upload(filePath, iconFile);

      if (uploadError) {
        setMessage(`アイコンのアップロードに失敗しました: ${uploadError.message}`);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('icon')
        .getPublicUrl(filePath);
      iconUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from('settings').upsert({
      id: 1,
      department,
      employee_name: employeeName,
      interval_seconds: Number(interval),
      last_accident_date: lastAccidentDate,
      weather_source: weatherSource,
      icon_url: iconUrl || undefined,
    });

    if (error) {
      setMessage(`保存に失敗しました: ${error.message}`);
    } else {
      setMessage('保存しました');
    }

    setSaving(false);
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '480px' }}>
      <h1>専用設定ページ</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>部署</label>
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          style={{ display: 'block', width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>社員名</label>
        <input
          type="text"
          value={employeeName}
          onChange={(e) => setEmployeeName(e.target.value)}
          style={{ display: 'block', width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>切り替え間隔 (秒)</label>
        <input
          type="number"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          style={{ display: 'block', width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>最終事故日</label>
        <input
          type="date"
          value={lastAccidentDate}
          onChange={(e) => setLastAccidentDate(e.target.value)}
          style={{ display: 'block', width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>天気ソース</label>
        <input
          type="text"
          value={weatherSource}
          onChange={(e) => setWeatherSource(e.target.value)}
          style={{ display: 'block', width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>アイコン画像</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setIconFile(e.target.files ? e.target.files[0] : null)}
          style={{ display: 'block', width: '100%' }}
        />
      </div>

      <button onClick={handleSave} disabled={saving}>
        {saving ? '保存中...' : '保存する'}
      </button>

      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
    </main>
  );
}
