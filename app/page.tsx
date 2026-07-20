'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Settings = {
  id: number;
  department: string;
  employee_name: string;
  interval_seconds: number;
  last_accident_date: string;
  weather_source: string;
  icon_url: string;
};

type BoardStatus = {
  id: number;
  destination: string;
  return_time: string;
  trip_start_date: string | null;
  trip_end_date: string | null;
  updated_at: string;
};

const NO_INPUT_DESTINATIONS = ['工場', '組立場', '製品倉庫', '試作室', '最上', '車庫', '早退', '事務所', '休み', 'AM休'];
const INPUT_REQUIRED_DESTINATIONS = ['出張', '現場', '営業', '打ち合わせ', '中抜け', 'その他'];
const DESTINATION_OPTIONS = [...NO_INPUT_DESTINATIONS, ...INPUT_REQUIRED_DESTINATIONS];

const HIDE_RETURN_TIME_DESTINATIONS = ['事務所', '休み', 'AM休', '出張'];

const MORNING_OPTIONS = [8, 9, 10, 11, 12, 'すぐ戻る(30分以内)'] as const;
const AFTERNOON_HOURS = [13, 14, 15, 16, 17, 18];

export default function Home() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [destinationSelect, setDestinationSelect] = useState(NO_INPUT_DESTINATIONS[0]);
  const [customDestination, setCustomDestination] = useState('');
  const [returnHour, setReturnHour] = useState<number | null>(null);
  const [isReturnSoon, setIsReturnSoon] = useState(false);
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hh}:${mm}`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: settingsData } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (settingsData) {
      setSettings(settingsData as Settings);
    }

    const { data: boardData } = await supabase
      .from('board_status')
      .select('*')
      .eq('id', 1)
      .single();

    if (boardData) {
      const savedDestination = boardData.destination ?? '';
      if (NO_INPUT_DESTINATIONS.includes(savedDestination)) {
        setDestinationSelect(savedDestination);
      } else if (INPUT_REQUIRED_DESTINATIONS.includes(savedDestination)) {
        setDestinationSelect(savedDestination);
      } else if (savedDestination) {
        setDestinationSelect('その他');
        setCustomDestination(savedDestination);
      }

      const savedReturnTime = boardData.return_time ?? '';
      if (savedReturnTime === 'すぐ戻る') {
        setIsReturnSoon(true);
        setReturnHour(null);
      } else if (savedReturnTime) {
        const hour = parseInt(savedReturnTime.split(':')[0], 10);
        if (!Number.isNaN(hour)) {
          setReturnHour(hour);
          setIsReturnSoon(false);
        }
      }

      setTripStartDate(boardData.trip_start_date ?? '');
      setTripEndDate(boardData.trip_end_date ?? '');
    }

    setLoading(false);
  };

  const calcAccidentFreeDays = (lastAccidentDate: string) => {
    if (!lastAccidentDate) return null;
    const last = new Date(lastAccidentDate);
    const today = new Date();
    last.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - last.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : null;
  };

  const handleSelectHour = (value: number | 'すぐ戻る(30分以内)') => {
    if (value === 'すぐ戻る(30分以内)') {
      setIsReturnSoon(true);
      setReturnHour(null);
    } else {
      setIsReturnSoon(false);
      setReturnHour(value);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    setMessage('');

    const finalDestination = INPUT_REQUIRED_DESTINATIONS.includes(destinationSelect)
      ? customDestination
      : destinationSelect;

    const finalReturnTime = HIDE_RETURN_TIME_DESTINATIONS.includes(destinationSelect)
      ? ''
      : isReturnSoon
        ? 'すぐ戻る'
        : returnHour !== null
          ? `${String(returnHour).padStart(2, '0')}:00`
          : '';

    const { error } = await supabase.from('board_status').upsert({
      id: 1,
      destination: finalDestination,
      return_time: finalReturnTime,
      trip_start_date: destinationSelect === '出張' ? tripStartDate || null : null,
      trip_end_date: destinationSelect === '出張' ? tripEndDate || null : null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(`更新に失敗しました: ${error.message}`);
    } else {
      setMessage('更新しました');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <main style={{ padding: '2rem', maxWidth: '480px' }}>
        <p>読み込み中...</p>
      </main>
    );
  }

  const accidentFreeDays = settings
    ? calcAccidentFreeDays(settings.last_accident_date)
    : null;

  return (
    <main style={{ padding: '2rem', maxWidth: '480px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '1rem',
        }}
      >
        <h1 style={{ margin: 0 }}>外出先ボード</h1>
        <span style={{ fontSize: '0.95rem', color: '#555' }}>
          只今の時刻：
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>
            {currentTime}
          </span>
        </span>
      </div>

      {settings && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {settings.icon_url && (
            <img
              src={settings.icon_url}
              alt="アイコン"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          )}
          <div>
            <p>部署：{settings.department}</p>
            <p>社員名：{settings.employee_name}</p>
          </div>
        </div>
      )}

      {accidentFreeDays !== null && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '0.75rem',
            backgroundColor: '#f0f8ff',
            borderRadius: '8px',
          }}
        >
          <p style={{ margin: 0 }}>
            本日で無事故継続 <strong>{accidentFreeDays}</strong> 日
          </p>
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label>外出先</label>
        <select
          value={destinationSelect}
          onChange={(e) => setDestinationSelect(e.target.value)}
          style={{ display: 'block', width: '100%' }}
        >
          {DESTINATION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {INPUT_REQUIRED_DESTINATIONS.includes(destinationSelect) && (
          <input
            type="text"
            value={customDestination}
            onChange={(e) => setCustomDestination(e.target.value)}
            placeholder="外出先を入力"
            style={{ display: 'block', width: '100%', marginTop: '0.5rem' }}
          />
        )}

        {destinationSelect === '出張' && (
          <div style={{ marginTop: '0.5rem' }}>
            <label>出張期間</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="date"
                value={tripStartDate}
                onChange={(e) => setTripStartDate(e.target.value)}
                style={{ flex: 1 }}
              />
              <span>〜</span>
              <input
                type="date"
                value={tripEndDate}
                onChange={(e) => setTripEndDate(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        )}
      </div>

      {!HIDE_RETURN_TIME_DESTINATIONS.includes(destinationSelect) && (
        <div style={{ marginBottom: '1rem' }}>
          <label>戻り予定時刻</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
              {MORNING_OPTIONS.map((option) => {
                const isSelected = option === 'すぐ戻る(30分以内)' ? isReturnSoon : returnHour === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectHour(option)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #ccc',
                      backgroundColor: isSelected ? '#2563eb' : '#fff',
                      color: isSelected ? '#fff' : '#000',
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
              {AFTERNOON_HOURS.map((hour) => (
                <button
                  key={hour}
                  type="button"
                  onClick={() => handleSelectHour(hour)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: returnHour === hour && !isReturnSoon ? '2px solid #2563eb' : '1px solid #ccc',
                    backgroundColor: returnHour === hour && !isReturnSoon ? '#2563eb' : '#fff',
                    color: returnHour === hour && !isReturnSoon ? '#fff' : '#000',
                  }}
                >
                  {hour}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button onClick={handleUpdate} disabled={saving}>
        {saving ? '更新中...' : '更新する'}
      </button>

      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
    </main>
  );
}
