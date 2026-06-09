import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  GitFork,
  Lock,
  LogOut,
  Medal,
  Shield,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { getOutcome, formatPick } from './lib/scoring';
import { useAuth } from './hooks/useAuth';
import { useQuinielaData } from './hooks/useQuinielaData';

const tabs = [
  { id: 'ranking', label: 'Tabla', icon: Trophy },
  { id: 'quiniela', label: 'Mi quiniela', icon: Check },
  { id: 'partidos', label: 'Partidos', icon: CalendarDays },
  { id: 'llaves', label: 'Llaves', icon: GitFork },
  { id: 'resultados', label: 'Resultados', icon: Shield, admin: true },
  { id: 'usuarios', label: 'Usuarios', icon: Users, admin: true },
];

function App() {
  if (!isSupabaseConfigured) {
    return <ConfigWarning />;
  }

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { session, profile, loading } = useAuth();

  if (loading) return <ShellMessage text="Cargando sesión..." />;
  if (!session) return <Login />;
  if (!profile) return <ShellMessage text="Tu usuario no tiene perfil asignado. Pide al admin revisar profiles." />;

  return <Dashboard profile={profile} />;
}

function Dashboard({ profile }) {
  const [activeTab, setActiveTab] = useState('ranking');
  const data = useQuinielaData();
  const visibleTabs = tabs.filter((tab) => !tab.admin || profile.role === 'admin');

  const active = visibleTabs.some((tab) => tab.id === activeTab) ? activeTab : 'ranking';

  return (
    <div className="min-h-screen bg-pitch text-slate-100">
      <header className="border-b border-line bg-panel/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Mundial 2026</p>
            <h1 className="mt-1 text-2xl font-black text-white">Quiniela Minigrip</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold">{profile.name}</p>
              <p className="text-xs uppercase text-slate-400">{profile.role}</p>
            </div>
            <button className="icon-button" onClick={() => supabase.auth.signOut()} title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-md border border-line bg-panel p-2">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                className={`tab-button ${active === tab.id ? 'tab-active' : ''}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {data.loading ? <ShellMessage text="Cargando quiniela..." compact /> : null}
        {data.error ? <Notice tone="danger">{data.error}</Notice> : null}
        {!data.loading && active === 'ranking' ? <Ranking stats={data.stats} /> : null}
        {!data.loading && active === 'quiniela' ? <MyPicks profile={profile} data={data} /> : null}
        {!data.loading && active === 'partidos' ? <Matches data={data} /> : null}
        {!data.loading && active === 'llaves' ? <KnockoutBoard /> : null}
        {!data.loading && active === 'resultados' ? <ResultsAdmin data={data} /> : null}
        {!data.loading && active === 'usuarios' ? <UsersAdmin data={data} /> : null}
      </main>
    </div>
  );
}

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: `${username.trim().toLowerCase()}@quiniela.local`,
      password,
    });

    if (loginError) setError('Usuario o contraseña incorrectos.');
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pitch px-4 text-slate-100">
      <form className="w-full max-w-md rounded-md border border-line bg-panel p-6 shadow-glow" onSubmit={handleSubmit}>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Acceso privado</p>
        <h1 className="mt-2 text-3xl font-black text-white">Quiniela Mundial 2026</h1>
        <div className="mt-6 space-y-4">
          <Field label="Usuario" value={username} onChange={setUsername} autoComplete="username" />
          <Field label="Contraseña" value={password} onChange={setPassword} type="password" autoComplete="current-password" />
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <button className="primary-button w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Ranking({ stats }) {
  return (
    <section className="section">
      <SectionTitle icon={Medal} title="Tabla de posiciones" />
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Posición</th>
              <th>Nombre</th>
              <th>Pronósticos</th>
              <th>Aciertos</th>
              <th>Precisión</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((user, index) => (
              <tr key={user.id}>
                <td className="font-black text-gold">#{index + 1}</td>
                <td>{user.name}</td>
                <td>{user.picksCount}</td>
                <td>{user.hits}</td>
                <td>{user.precision}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MyPicks({ profile, data }) {
  const myPicks = useMemo(
    () => new Map(data.picks.filter((pick) => pick.user_id === profile.id).map((pick) => [pick.match_id, pick])),
    [data.picks, profile.id],
  );

  async function savePick(matchId, pick) {
    if (data.resultByMatch.has(matchId)) return;

    const existing = myPicks.get(matchId);
    if (existing) {
      await supabase.from('picks').update({ pick }).eq('id', existing.id);
    } else {
      await supabase.from('picks').insert({ user_id: profile.id, match_id: matchId, pick });
    }
    data.refresh();
  }

  return (
    <section className="section">
      <SectionTitle icon={Check} title="Mi quiniela" />
      <div className="match-grid">
        {data.matches.map((match) => {
          const result = data.resultByMatch.get(match.id);
          const selected = myPicks.get(match.id)?.pick;
          const resolved = Boolean(result);
          const hit = resolved && selected === result.outcome;

          return (
            <article className="match-card" key={match.id}>
              <div className="match-meta">
                <span>Grupo {match.group_name}</span>
                {resolved ? <span className="locked"><Lock size={13} /> Cerrado</span> : <span>Abierto</span>}
              </div>
              <div className="teams">
                <strong>{match.home_team}</strong>
                <span>vs</span>
                <strong>{match.away_team}</strong>
              </div>
              <div className="pick-row">
                {['1', 'x', '2'].map((pick) => (
                  <button
                    className={`pick-button ${selected === pick ? 'pick-selected' : ''}`}
                    disabled={resolved}
                    key={pick}
                    onClick={() => savePick(match.id, pick)}
                  >
                    {formatPick(pick)}
                  </button>
                ))}
              </div>
              {resolved ? (
                <p className={hit ? 'result-hit' : 'result-miss'}>
                  {hit ? <Check size={16} /> : <X size={16} />}
                  Resultado {result.score_home}-{result.score_away}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Matches({ data }) {
  const groups = groupMatches(data.matches);

  return (
    <section className="space-y-5">
      <SectionTitle icon={CalendarDays} title="Partidos" />
      {Object.entries(groups).map(([group, matches]) => (
        <div className="section" key={group}>
          <h3 className="mb-4 text-lg font-black text-gold">Grupo {group}</h3>
          <div className="match-grid">
            {matches.map((match) => {
              const result = data.resultByMatch.get(match.id);
              const counts = countPicks(data.picksByMatch.get(match.id) ?? []);
              return (
                <article className="match-card" key={match.id}>
                  <div className="match-meta">
                    <span>{new Date(match.match_date).toLocaleDateString('es-MX')}</span>
                    <span>{result ? 'Final' : 'Votos'}</span>
                  </div>
                  <div className="teams">
                    <strong>{match.home_team}</strong>
                    <span>{result ? `${result.score_home}-${result.score_away}` : 'vs'}</span>
                    <strong>{match.away_team}</strong>
                  </div>
                  {!result ? (
                    <div className="vote-counts">
                      <span>1: {counts['1']}</span>
                      <span>X: {counts.x}</span>
                      <span>2: {counts['2']}</span>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

const leftBracket = [
  [
    { id: 'M74', detail: '1E vs 3ABCDF', tone: 'blue' },
    { id: 'M72', detail: '1I vs 3CDFGH', tone: 'blue' },
    { id: 'M73', detail: '2A vs 2B', tone: 'blue' },
    { id: 'M75', detail: '1F vs 2C', tone: 'blue' },
    { id: 'M83', detail: '2K vs 2L', tone: 'teal' },
    { id: 'M84', detail: '1H vs 2J', tone: 'teal' },
    { id: 'M81', detail: '1D vs 3EFIJ', tone: 'teal' },
    { id: 'M82', detail: '1G vs 3AEHJ', tone: 'teal' },
  ],
  [
    { id: 'M89', detail: 'W74 vs W77', tone: 'blue' },
    { id: 'M90', detail: 'W73 vs W75', tone: 'blue' },
    { id: 'M93', detail: 'W83 vs W84', tone: 'teal' },
    { id: 'M94', detail: 'W81 vs W82', tone: 'teal' },
  ],
  [
    { id: 'M97', detail: 'W89 vs W90', tone: 'blue' },
    { id: 'M98', detail: 'W93 vs W94', tone: 'teal' },
  ],
  [{ id: 'M101', detail: 'W97 vs W98', tone: 'pink' }],
];

const rightBracket = [
  [{ id: 'M102', detail: 'W99 vs W100', tone: 'pink' }],
  [
    { id: 'M99', detail: 'W91 vs W92', tone: 'green' },
    { id: 'M100', detail: 'W95 vs W96', tone: 'red' },
  ],
  [
    { id: 'M91', detail: 'W76 vs W78', tone: 'green' },
    { id: 'M92', detail: 'W79 vs W80', tone: 'green' },
    { id: 'M95', detail: 'W86 vs W88', tone: 'red' },
    { id: 'M96', detail: 'W85 vs W87', tone: 'red' },
  ],
  [
    { id: 'M76', detail: '1O vs 2F', tone: 'green' },
    { id: 'M78', detail: '2E vs 2I', tone: 'green' },
    { id: 'M79', detail: '1A vs 3CEFH', tone: 'green' },
    { id: 'M80', detail: '1L vs 3EHJK', tone: 'green' },
    { id: 'M86', detail: '1J vs 2H', tone: 'red' },
    { id: 'M88', detail: '2D vs 2G', tone: 'red' },
    { id: 'M85', detail: '1B vs 3EFGJ', tone: 'red' },
    { id: 'M87', detail: '1K vs 3DEJL', tone: 'red' },
  ],
];

const roundLabels = ['R32', 'R16', 'QF', 'SF'];

function KnockoutBoard() {
  return (
    <section className="section">
      <SectionTitle icon={GitFork} title="Llaves de eliminacion" />
      <div className="bracket-scroll">
        <div className="bracket-board">
          <div className="bracket-labels">
            {['R32', 'R16', 'QF', 'SF', 'Final', 'SF', 'QF', 'R16', 'R32'].map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>

          <div className="bracket-content">
            <div className="pathway-label">Pathway 1</div>
            <BracketSide columns={leftBracket} side="left" />

            <div className="final-stack">
              <div className="trophy-mark">
                <Trophy size={44} />
              </div>
              <MatchPill match={{ id: 'M104', detail: 'Final', tone: 'gold' }} />
              <MatchPill match={{ id: 'M103', detail: 'Bronze final', tone: 'orange' }} />
            </div>

            <BracketSide columns={rightBracket} side="right" />
            <div className="pathway-label pathway-right">Pathway 2</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BracketSide({ columns, side }) {
  return (
    <div className={`bracket-side ${side === 'right' ? 'bracket-side-right' : ''}`}>
      {columns.map((round, index) => (
        <div className={`bracket-round bracket-round-${index + 1}`} key={`${side}-${roundLabels[index]}`}>
          {round.map((match) => (
            <MatchPill key={match.id} match={match} />
          ))}
        </div>
      ))}
    </div>
  );
}

function MatchPill({ match }) {
  return (
    <div className={`bracket-pill bracket-${match.tone}`}>
      <strong>{match.id}</strong>
      <span>{match.detail}</span>
    </div>
  );
}

function ResultsAdmin({ data }) {
  return (
    <section className="section">
      <SectionTitle icon={Shield} title="Resultados" />
      <div className="space-y-3">
        {data.matches.map((match) => (
          <ResultForm data={data} key={match.id} match={match} result={data.resultByMatch.get(match.id)} />
        ))}
      </div>
    </section>
  );
}

function ResultForm({ data, match, result }) {
  const [home, setHome] = useState(result?.score_home ?? '');
  const [away, setAway] = useState(result?.score_away ?? '');

  async function saveResult(event) {
    event.preventDefault();
    const payload = {
      match_id: match.id,
      score_home: Number(home),
      score_away: Number(away),
      outcome: getOutcome(home, away),
    };

    if (result) {
      await supabase.from('results').update(payload).eq('id', result.id);
    } else {
      await supabase.from('results').insert(payload);
    }
    data.refresh();
  }

  return (
    <form className="admin-row" onSubmit={saveResult}>
      <div>
        <p className="font-semibold">{match.home_team} vs {match.away_team}</p>
        <p className="text-xs text-slate-400">Grupo {match.group_name}</p>
      </div>
      <div className="score-inputs">
        <input min="0" required type="number" value={home} onChange={(event) => setHome(event.target.value)} />
        <span>-</span>
        <input min="0" required type="number" value={away} onChange={(event) => setAway(event.target.value)} />
        <button className="primary-button">Guardar</button>
      </div>
    </form>
  );
}

function UsersAdmin({ data }) {
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'user' });
  const [message, setMessage] = useState('');

  async function createUser(event) {
    event.preventDefault();
    setMessage('');

    const { error } = await supabase.functions.invoke('admin-create-user', {
      body: { action: 'create', ...form },
    });

    if (error) {
      setMessage('Configura la Edge Function admin-create-user o crea el usuario desde Supabase Auth.');
    } else {
      setMessage('Usuario creado.');
      setForm({ name: '', username: '', password: '', role: 'user' });
      data.refresh();
    }
  }

  async function deleteUser(userId) {
    await supabase.functions.invoke('admin-create-user', {
      body: { action: 'delete', userId },
    });
    data.refresh();
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <form className="section" onSubmit={createUser}>
        <SectionTitle icon={UserPlus} title="Alta de usuarios" />
        <div className="space-y-3">
          <Field label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Field label="Usuario" value={form.username} onChange={(value) => setForm({ ...form, username: value })} />
          <Field label="Contraseña" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
          <label className="field-label">
            Rol
            <select className="field-input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <button className="primary-button w-full">Crear usuario</button>
          {message ? <Notice>{message}</Notice> : null}
        </div>
      </form>

      <div className="section">
        <SectionTitle icon={Users} title="Usuarios" />
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Pronósticos</th>
                <th>Aciertos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.stats.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>{user.picksCount}</td>
                  <td>{user.hits}</td>
                  <td>
                    <button className="danger-button" onClick={() => deleteUser(user.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, type = 'text', autoComplete }) {
  return (
    <label className="field-label">
      {label}
      <input
        className="field-input"
        autoComplete={autoComplete}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="text-accent" size={20} />
      <h2 className="text-xl font-black text-white">{title}</h2>
    </div>
  );
}

function Notice({ children, tone = 'info' }) {
  return <div className={`notice ${tone === 'danger' ? 'notice-danger' : ''}`}>{children}</div>;
}

function ShellMessage({ text, compact = false }) {
  return (
    <div className={`${compact ? 'section' : 'flex min-h-screen items-center justify-center bg-pitch px-4'} text-slate-100`}>
      <div className="rounded-md border border-line bg-panel px-5 py-4 text-sm text-slate-300">{text}</div>
    </div>
  );
}

function ConfigWarning() {
  return <ShellMessage text="Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Copia .env.example a .env.local y agrega tus llaves." />;
}

function groupMatches(matches) {
  return matches.reduce((groups, match) => {
    groups[match.group_name] = groups[match.group_name] ?? [];
    groups[match.group_name].push(match);
    return groups;
  }, {});
}

function countPicks(picks) {
  return picks.reduce(
    (counts, pick) => {
      counts[pick.pick] += 1;
      return counts;
    },
    { 1: 0, x: 0, 2: 0 },
  );
}

export default App;
