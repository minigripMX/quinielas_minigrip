import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarClock,
  Check,
  GitFork,
  HelpCircle,
  ImageIcon,
  Layers,
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
  { id: 'guia', label: 'Guia', icon: HelpCircle },
  { id: 'imagenes', label: 'Imagenes', icon: ImageIcon },
  { id: 'ranking', label: 'Tabla', icon: Trophy },
  { id: 'quiniela', label: 'Mi quiniela', icon: Check },
  { id: 'partidos', label: 'Partidos', icon: CalendarDays },
  { id: 'llaves', label: 'Llaves', icon: GitFork },
  { id: 'quinielas-admin', label: 'Quinielas', icon: Layers, admin: true },
  { id: 'calendario-admin', label: 'Calendario', icon: CalendarClock, admin: true },
  { id: 'resultados', label: 'Resultados', icon: Shield, admin: true },
  { id: 'usuarios', label: 'Usuarios', icon: Users, admin: true },
];

const phaseFilters = [
  { id: 'all', label: 'Todos' },
  { id: 'group', label: 'Fase de grupos' },
  { id: 'knockout', label: 'Eliminatorias' },
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
        {!data.loading ? <WorldCupOverview data={data} /> : null}
        {!data.loading ? <PoolSelector data={data} /> : null}
        {!data.loading && active === 'guia' ? <Guide /> : null}
        {!data.loading && active === 'imagenes' ? <WorldImages /> : null}
        {!data.loading && active === 'ranking' ? <Ranking stats={data.stats.filter((user) => user.role !== 'admin')} /> : null}
        {!data.loading && active === 'quiniela' ? <MyPicks profile={profile} data={data} /> : null}
        {!data.loading && active === 'partidos' ? <Matches data={data} /> : null}
        {!data.loading && active === 'llaves' ? <KnockoutBoard /> : null}
        {!data.loading && active === 'quinielas-admin' ? <PoolsAdmin data={data} /> : null}
        {!data.loading && active === 'calendario-admin' ? <CalendarAdmin data={data} /> : null}
        {!data.loading && active === 'resultados' ? <ResultsAdmin data={data} /> : null}
        {!data.loading && active === 'usuarios' ? <UsersAdmin data={data} /> : null}
      </main>
    </div>
  );
}

const worldImageSections = [
  {
    title: 'Estadios',
    subtitle: 'Sedes y ambiente de partido',
    image: '',
    filename: 'public/images/estadios.jpg',
  },
  {
    title: 'Aficion',
    subtitle: 'Colores, banderas y energia mundialista',
    image: '',
    filename: 'public/images/aficion.jpg',
  },
  {
    title: 'Camino a la final',
    subtitle: 'Momentos clave de eliminatoria',
    image: '',
    filename: 'public/images/final.jpg',
  },
  {
    title: 'Quiniela Minigrip',
    subtitle: 'Identidad interna del torneo',
    image: '',
    filename: 'public/images/minigrip.jpg',
  },
];

function WorldImages() {
  return (
    <section className="section">
      <SectionTitle icon={ImageIcon} title="Imagenes del Mundial" />
      <div className="image-guide">
        Agrega tus imagenes en <strong>public/images</strong> y coloca la ruta en el arreglo <strong>worldImageSections</strong> de <strong>src/App.jsx</strong>.
      </div>
      <div className="world-image-grid">
        {worldImageSections.map((item, index) => (
          <article className="world-image-card" key={item.title}>
            {item.image ? (
              <img alt={item.title} src={item.image} />
            ) : (
              <div className={`image-placeholder image-placeholder-${index + 1}`}>
                <Trophy size={42} />
              </div>
            )}
            <div>
              <h3>{item.title}</h3>
              <p>{item.subtitle}</p>
              <span>{item.filename}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function WorldCupOverview({ data }) {
  const resolved = data.results.length;
  const progress = data.matches.length ? Math.round((resolved / data.matches.length) * 100) : 0;
  const participants = data.profiles.filter((profile) => profile.role !== 'admin').length;

  return (
    <section className="world-hero">
      <div>
        <p className="world-kicker">Mundial 2026</p>
        <h2>{data.activePool?.name ?? 'Sin quiniela activa'}</h2>
        <p className="world-copy">Administra varias quinielas, cambia de torneo y sigue el avance de cada marcador en tiempo real.</p>
      </div>
      <div className="world-visual" aria-hidden="true">
        <div className="world-ball" />
        <div className="world-ring world-ring-one" />
        <div className="world-ring world-ring-two" />
      </div>
      <div className="world-stats">
        <StatTile label="Quinielas" value={data.pools.length} />
        <StatTile label="Partidos" value={data.matches.length} />
        <StatTile label="Jugadores" value={participants} />
        <StatTile label="Avance" value={`${progress}%`} />
      </div>
    </section>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="stat-tile">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PoolSelector({ data }) {
  if (!data.pools.length) {
    return <Notice tone="danger">No hay quinielas creadas. Ejecuta la migracion multi-pools o crea una desde Supabase.</Notice>;
  }

  return (
    <section className="pool-bar">
      <label className="field-label">
        Quiniela activa
        <select className="field-input" value={data.activePool?.id ?? ''} onChange={(event) => data.setSelectedPoolId(event.target.value)}>
          {data.pools.map((pool) => (
            <option key={pool.id} value={pool.id}>
              {pool.name}
            </option>
          ))}
        </select>
      </label>
      <div className="pool-summary">
        <span>{data.activePool?.description || 'Sin descripcion'}</span>
      </div>
    </section>
  );
}

function Guide() {
  return (
    <section className="section">
      <SectionTitle icon={HelpCircle} title="Guia de uso" />
      <div className="guide-grid">
        <article className="guide-item">
          <h3>1. Mi quiniela</h3>
          <p>Entra a Mi quiniela y elige un pronostico por partido: 1 si gana el local, X si empatan, 2 si gana el visitante.</p>
        </article>
        <article className="guide-item">
          <h3>2. Bloqueo de votos</h3>
          <p>Puedes cambiar tu voto hasta antes del inicio del partido. Al comenzar, queda cerrado aunque el admin todavia no capture marcador.</p>
        </article>
        <article className="guide-item">
          <h3>3. Puntos y tabla</h3>
          <p>Cada acierto suma en la Tabla. La precision se calcula con tus pronosticos de partidos que ya tienen resultado.</p>
        </article>
        <article className="guide-item">
          <h3>4. Fases</h3>
          <p>Usa los filtros para ver Fase de grupos o Eliminatorias. Los partidos muestran numero M001, M073, etc. para ubicarlos facil.</p>
        </article>
        <article className="guide-item">
          <h3>5. Partidos</h3>
          <p>La vista Partidos muestra calendario, marcador final si ya existe, o conteo de votos 1/X/2 si sigue abierto.</p>
        </article>
        <article className="guide-item">
          <h3>6. Llaves</h3>
          <p>La pestaña Llaves muestra el camino de eliminatorias. Los nombres como Ganador M097 se resuelven segun avanza el torneo.</p>
        </article>
      </div>
    </section>
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
  const [phase, setPhase] = useState('group');
  const myPicks = useMemo(
    () => new Map(data.picks.filter((pick) => pick.user_id === profile.id).map((pick) => [pick.match_id, pick])),
    [data.picks, profile.id],
  );
  const visibleMatches = filterMatchesByPhase(data.matches, phase);
  const groups = groupMatches(visibleMatches);
  const teamResolver = buildTournamentResolver(data.matches, data.results);

  async function savePick(matchId, pick) {
    const match = data.matches.find((item) => item.id === matchId);
    if (!canEditPick(match, data.resultByMatch)) return;

    const existing = myPicks.get(matchId);
    if (existing) {
      await supabase.from('picks').update({ pick }).eq('id', existing.id);
    } else {
      await supabase.from('picks').insert({ user_id: profile.id, match_id: matchId, pick });
    }
    data.refresh();
  }

  return (
    <section className="space-y-5">
      <div className="section">
      <SectionTitle icon={Check} title="Mi quiniela" />
        <PhaseFilter value={phase} onChange={setPhase} />
      </div>

      {Object.entries(groups).map(([group, matches]) => (
        <div className="section" key={group}>
          <h3 className="mb-4 text-lg font-black text-gold">{group}</h3>
          <div className="match-grid">
            {matches.map((match) => {
              const result = data.resultByMatch.get(match.id);
              const selected = myPicks.get(match.id)?.pick;
              const locked = !canEditPick(match, data.resultByMatch);
              const resolved = Boolean(result);
              const hit = resolved && selected === result.outcome;

              return (
                <article className="match-card" key={match.id}>
                  <MatchMeta match={match} right={locked ? <span className="locked"><Lock size={13} /> Cerrado</span> : <span>Abierto</span>} />
                  <div className="teams">
                    <TeamName value={match.home_team} resolver={teamResolver} />
                    <span>vs</span>
                    <TeamName value={match.away_team} resolver={teamResolver} />
                  </div>
                  <div className="pick-row">
                    {['1', 'x', '2'].map((pick) => (
                      <button
                        className={`pick-button ${selected === pick ? 'pick-selected' : ''}`}
                        disabled={locked}
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
        </div>
      ))}
    </section>
  );
}

function Matches({ data }) {
  const [phase, setPhase] = useState('group');
  const visibleMatches = filterMatchesByPhase(data.matches, phase);
  const groups = groupMatches(visibleMatches);
  const teamResolver = buildTournamentResolver(data.matches, data.results);

  return (
    <section className="space-y-5">
      <div className="section">
        <SectionTitle icon={CalendarDays} title="Partidos" />
        <PhaseFilter value={phase} onChange={setPhase} />
      </div>
      {Object.entries(groups).map(([group, matches]) => (
        <div className="section" key={group}>
          <h3 className="mb-4 text-lg font-black text-gold">{group}</h3>
          <div className="match-grid">
            {matches.map((match) => {
              const result = data.resultByMatch.get(match.id);
              const counts = countPicks(data.picksByMatch.get(match.id) ?? []);
              return (
                <article className="match-card" key={match.id}>
                  <MatchMeta match={match} right={<span>{result ? 'Final' : 'Votos'}</span>} />
                  <div className="teams">
                    <TeamName value={match.home_team} resolver={teamResolver} />
                    <span>{result ? `${result.score_home}-${result.score_away}` : 'vs'}</span>
                    <TeamName value={match.away_team} resolver={teamResolver} />
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

function PoolsAdmin({ data }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    cloneCurrent: true,
    makeActive: false,
  });
  const [message, setMessage] = useState('');

  async function createPool(event) {
    event.preventDefault();
    setMessage('');

    if (form.makeActive) {
      await supabase.from('pools').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { data: pool, error } = await supabase
      .from('pools')
      .insert({
        name: form.name.trim(),
        description: form.description.trim(),
        is_active: form.makeActive,
      })
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    if (form.cloneCurrent && data.matches.length) {
      const copiedMatches = data.matches.map((match) => ({
        pool_id: pool.id,
        match_number: match.match_number,
        group_name: match.group_name,
        home_team: match.home_team,
        away_team: match.away_team,
        match_date: match.match_date,
        stage: match.stage ?? 'group',
        round_label: match.round_label,
        display_order: match.display_order,
      }));

      const { error: matchError } = await supabase.from('matches').insert(copiedMatches);
      if (matchError) {
        setMessage(`Quiniela creada, pero no se pudieron copiar partidos: ${matchError.message}`);
        data.refresh();
        return;
      }
    }

    setMessage('Quiniela creada.');
    setForm({ name: '', description: '', cloneCurrent: true, makeActive: false });
    data.setSelectedPoolId(pool.id);
    data.refresh();
  }

  async function setActivePool(poolId) {
    await supabase.from('pools').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('pools').update({ is_active: true }).eq('id', poolId);
    data.setSelectedPoolId(poolId);
    data.refresh();
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <form className="section" onSubmit={createPool}>
        <SectionTitle icon={Layers} title="Crear quiniela" />
        <div className="space-y-3">
          <Field label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <label className="field-label">
            Descripcion
            <textarea
              className="field-input min-h-24"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>
          <label className="check-row">
            <input
              checked={form.cloneCurrent}
              onChange={(event) => setForm({ ...form, cloneCurrent: event.target.checked })}
              type="checkbox"
            />
            Copiar partidos de la quiniela actual
          </label>
          <label className="check-row">
            <input
              checked={form.makeActive}
              onChange={(event) => setForm({ ...form, makeActive: event.target.checked })}
              type="checkbox"
            />
            Marcar como quiniela activa
          </label>
          <button className="primary-button w-full" disabled={!form.name.trim()}>Crear quiniela</button>
          {message ? <Notice>{message}</Notice> : null}
        </div>
      </form>

      <div className="section">
        <SectionTitle icon={Layers} title="Quinielas existentes" />
        <div className="pool-list">
          {data.pools.map((pool) => (
            <article className="pool-card" key={pool.id}>
              <div>
                <h3>{pool.name}</h3>
                <p>{pool.description || 'Sin descripcion'}</p>
              </div>
              <div className="pool-actions">
                {pool.is_active ? <span className="pool-badge">Activa</span> : null}
                <button className="primary-button" onClick={() => setActivePool(pool.id)}>Usar</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CalendarAdmin({ data }) {
  const [phase, setPhase] = useState('group');
  const visibleMatches = filterMatchesByPhase(data.matches, phase);
  const groups = groupMatches(visibleMatches);

  return (
    <section className="space-y-5">
      <div className="section">
        <SectionTitle icon={CalendarClock} title="Calendario y equipos" />
        <PhaseFilter value={phase} onChange={setPhase} />
      </div>

      {Object.entries(groups).map(([group, matches]) => (
        <div className="section" key={group}>
          <h3 className="mb-4 text-lg font-black text-gold">{group}</h3>
          <div className="space-y-3">
            {matches.map((match) => (
              <CalendarMatchForm data={data} key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function CalendarMatchForm({ data, match }) {
  const [form, setForm] = useState({
    home_team: match.home_team,
    away_team: match.away_team,
    match_date: toDateTimeLocal(match.match_date),
  });
  const [message, setMessage] = useState('');

  async function saveMatch(event) {
    event.preventDefault();
    setMessage('');

    const { error } = await supabase
      .from('matches')
      .update({
        home_team: form.home_team.trim(),
        away_team: form.away_team.trim(),
        match_date: new Date(form.match_date).toISOString(),
      })
      .eq('id', match.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Guardado.');
    data.refresh();
  }

  return (
    <form className="calendar-row" onSubmit={saveMatch}>
      <div className="calendar-title">
        <span className="match-number-inline">{formatMatchNumber(match)}</span>
        <span>{getMatchLabel(match)}</span>
      </div>
      <input
        className="field-input"
        value={form.home_team}
        onChange={(event) => setForm({ ...form, home_team: event.target.value })}
      />
      <input
        className="field-input"
        value={form.away_team}
        onChange={(event) => setForm({ ...form, away_team: event.target.value })}
      />
      <input
        className="field-input"
        type="datetime-local"
        value={form.match_date}
        onChange={(event) => setForm({ ...form, match_date: event.target.value })}
      />
      <button className="primary-button">Guardar</button>
      {message ? <span className="calendar-message">{message}</span> : null}
    </form>
  );
}

function ResultsAdmin({ data }) {
  const [phase, setPhase] = useState('group');
  const visibleMatches = filterMatchesByPhase(data.matches, phase);
  const groups = groupMatches(visibleMatches);
  const teamResolver = buildTournamentResolver(data.matches, data.results);

  return (
    <section className="space-y-5">
      <div className="section">
        <SectionTitle icon={Shield} title="Resultados" />
        <PhaseFilter value={phase} onChange={setPhase} />
      </div>

      {Object.entries(groups).map(([group, matches]) => (
        <div className="section" key={group}>
          <h3 className="mb-4 text-lg font-black text-gold">{group}</h3>
          <div className="space-y-3">
            {matches.map((match) => (
              <ResultForm data={data} key={match.id} match={match} result={data.resultByMatch.get(match.id)} teamResolver={teamResolver} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function ResultForm({ data, match, result, teamResolver }) {
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
        <p className="font-semibold">
          <span className="match-number-inline">{formatMatchNumber(match)}</span>
          <TeamName value={match.home_team} resolver={teamResolver} inline /> vs <TeamName value={match.away_team} resolver={teamResolver} inline />
        </p>
        <p className="text-xs text-slate-400">{getMatchLabel(match)}</p>
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

function PhaseFilter({ value, onChange }) {
  return (
    <div className="phase-filter">
      {phaseFilters.map((filter) => (
        <button
          className={`phase-button ${value === filter.id ? 'phase-active' : ''}`}
          key={filter.id}
          onClick={() => onChange(filter.id)}
          type="button"
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

function MatchMeta({ match, right }) {
  return (
    <div className="match-meta">
      <span className="match-meta-left">
        <span className="match-number">{formatMatchNumber(match)}</span>
        <span>{getMatchLabel(match)}</span>
        <span>{new Date(match.match_date).toLocaleDateString('es-MX')}</span>
      </span>
      {right}
    </div>
  );
}

function TeamName({ value, resolver, inline = false }) {
  const expanded = resolver(value);
  const content = (
    <>
      <strong>{expanded.label}</strong>
      {expanded.context ? <small>{expanded.context}</small> : null}
    </>
  );

  if (inline) {
    return <span className="team-inline">{expanded.label}</span>;
  }

  return <span className="team-name">{content}</span>;
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
    const groupKey = getMatchGroupTitle(match);
    groups[groupKey] = groups[groupKey] ?? [];
    groups[groupKey].push(match);
    return groups;
  }, {});
}

function filterMatchesByPhase(matches, phase) {
  if (phase === 'all') return matches;
  return matches.filter((match) => (match.stage ?? 'group') === phase);
}

function formatMatchNumber(match) {
  if (!match.match_number) return 'M--';
  return `M${String(match.match_number).padStart(3, '0')}`;
}

function toDateTimeLocal(value) {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function buildTournamentResolver(matches, results) {
  const matchByNumber = new Map(matches.map((match) => [formatMatchNumber(match), match]));
  const resultByMatch = new Map(results.map((result) => [result.match_id, result]));
  const groupTables = buildGroupTables(matches, resultByMatch);
  const thirdPlaces = [...groupTables.values()]
    .map((table) => table[2])
    .filter(Boolean)
    .sort(compareStandingRows);

  function resolve(value, seen = new Set()) {
    const text = String(value ?? '');
    const groupPlace = text.match(/^(\d)(?:er|do) lugar Grupo ([A-L])$/);
    const bestThird = text.match(/^Mejor 3er lugar ([A-L/]+)$/);
    const matchReference = text.match(/^(Ganador|Perdedor) M(\d{3})$/);

    if (groupPlace) {
      const position = Number(groupPlace[1]) - 1;
      const group = groupPlace[2];
      const table = groupTables.get(group);
      const complete = isGroupComplete(matches, resultByMatch, group);
      const row = complete ? table?.[position] : null;

      return {
        label: row?.team ?? 'Por definir',
        context: row ? text : `${text} se define al cerrar el Grupo ${group}`,
      };
    }

    if (bestThird) {
      const candidates = bestThird[1].split('/');
      const complete = candidates.every((group) => isGroupComplete(matches, resultByMatch, group));
      const row = complete
        ? thirdPlaces.find((third) => candidates.includes(third.group))
        : null;

      return {
        label: row?.team ?? 'Por definir',
        context: row ? text : `${text} se define con mejores terceros`,
      };
    }

    if (matchReference) {
      const kind = matchReference[1];
      const matchNumber = `M${matchReference[2]}`;
      const sourceMatch = matchByNumber.get(matchNumber);

      if (!sourceMatch) {
        return { label: text };
      }

      if (seen.has(matchNumber)) {
        return { label: text, context: 'Referencia circular' };
      }

      const nextSeen = new Set(seen);
      nextSeen.add(matchNumber);

      const home = resolve(sourceMatch.home_team, nextSeen);
      const away = resolve(sourceMatch.away_team, nextSeen);
      const result = resultByMatch.get(sourceMatch.id);
      const unresolvedContext = `${matchNumber}: ${home.label} vs ${away.label}`;

      if (!result) {
        return {
          label: 'Por definir',
          context: `${kind} de ${unresolvedContext}`,
        };
      }

      if (result.outcome === 'x') {
        return {
          label: 'Por definir',
          context: `${matchNumber} requiere desempate`,
        };
      }

      const homeWins = result.outcome === '1';
      const winner = homeWins ? home : away;
      const loser = homeWins ? away : home;
      const selected = kind === 'Ganador' ? winner : loser;

      return {
        label: selected.label,
        context: `${kind} de ${matchNumber}`,
      };
    }

    return { label: text };
  }

  return resolve;
}

function buildGroupTables(matches, resultByMatch) {
  const tables = new Map();
  const groupMatches = matches.filter((match) => (match.stage ?? 'group') === 'group');

  groupMatches.forEach((match) => {
    if (!tables.has(match.group_name)) {
      tables.set(match.group_name, new Map());
    }

    const table = tables.get(match.group_name);
    ensureStandingRow(table, match.home_team, match.group_name);
    ensureStandingRow(table, match.away_team, match.group_name);

    const result = resultByMatch.get(match.id);
    if (!result) return;

    const home = table.get(match.home_team);
    const away = table.get(match.away_team);
    home.played += 1;
    away.played += 1;
    home.goalsFor += result.score_home;
    home.goalsAgainst += result.score_away;
    away.goalsFor += result.score_away;
    away.goalsAgainst += result.score_home;

    if (result.score_home > result.score_away) {
      home.points += 3;
    } else if (result.score_home < result.score_away) {
      away.points += 3;
    } else {
      home.points += 1;
      away.points += 1;
    }
  });

  return new Map(
    [...tables.entries()].map(([group, table]) => [
      group,
      [...table.values()].sort(compareStandingRows),
    ]),
  );
}

function ensureStandingRow(table, team, group) {
  if (!table.has(team)) {
    table.set(team, {
      team,
      group,
      played: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    });
  }
}

function compareStandingRows(a, b) {
  const goalDiffA = a.goalsFor - a.goalsAgainst;
  const goalDiffB = b.goalsFor - b.goalsAgainst;
  return (
    b.points - a.points ||
    goalDiffB - goalDiffA ||
    b.goalsFor - a.goalsFor ||
    a.team.localeCompare(b.team)
  );
}

function isGroupComplete(matches, resultByMatch, group) {
  const groupMatches = matches.filter((match) => (match.stage ?? 'group') === 'group' && match.group_name === group);
  return groupMatches.length === 6 && groupMatches.every((match) => resultByMatch.has(match.id));
}

function canEditPick(match, resultByMatch) {
  if (!match) return false;
  if (resultByMatch.has(match.id)) return false;
  return new Date(match.match_date).getTime() > Date.now();
}

function getMatchLabel(match) {
  if (match.stage === 'group') return `Grupo ${match.group_name}`;
  if (match.round_label) return match.round_label;
  return match.group_name ? `Grupo ${match.group_name}` : 'Partido';
}

function getMatchGroupTitle(match) {
  if (match.stage === 'group') return `Grupo ${match.group_name}`;
  if (match.round_label) return match.round_label;
  return match.group_name ? `Grupo ${match.group_name}` : 'Partidos';
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
