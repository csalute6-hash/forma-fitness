import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  useBlocker,
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams,
  NavLink,
  useSearchParams,
} from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  Dumbbell,
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  ChartNoAxesCombined,
  Settings as SettingsIcon,
  Plus,
  Clock,
  Menu,
  X,
  Trash2,
  Copy,
  Download,
  Upload,
  ShieldCheck,
  MoveUp,
  MoveDown,
  Target,
} from "lucide-react";
import { repository as repo } from "./data/repository";
import {
  type Data,
  type Plan,
  type Exercise,
  type Active,
  type Workout,
  type SetRecord,
  days,
  muscles,
  equipment,
  localDate,
  num,
  displayWeight,
  canonicalWeight,
  weightInput,
  numeric,
  volume,
  duration,
  time,
  weeks,
  weekStart,
  shiftDay,
  sorted,
  filterHistory,
  records,
  uuid,
  createWorkout,
  makeRow,
  finish,
  clearPersonal,
  planSchema,
  parseBackup,
} from "./domain/model";
import { Modal } from "./components/Modal";
import { LiveTimer } from "./components/LiveTimer";
import "./styles/app.css";
type Ctx = {
  data: Data;
  save: (
    fn: (d: Data) => void,
    message?: string,
    quiet?: boolean,
  ) => Promise<boolean>;
  go: (path: string) => void;
  dirty: React.MutableRefObject<boolean>;
  busy: boolean;
  error: string;
};
const Context = createContext<Ctx>(null!);
const useApp = () => useContext(Context);
const units = (d: Data) => d.preferences.weightUnit;
function Weight({
  value,
  integer = false,
}: {
  value: number;
  integer?: boolean;
}) {
  const { data } = useApp();
  return (
    <>
      {num(displayWeight(value, units(data)), integer ? 0 : 2)}{" "}
      <span className="unit">{units(data)}</span>
    </>
  );
}
function controlText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  return React.Children.toArray(node)
    .map((child) =>
      React.isValidElement<{ children?: ReactNode }>(child)
        ? controlText(child.props.children)
        : typeof child === "string" || typeof child === "number"
          ? String(child)
          : "",
    )
    .filter(Boolean)
    .join(" ");
}
function Button({
  children,
  onClick,
  kind = "",
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  kind?: string;
  disabled?: boolean;
}) {
  const { busy } = useApp();
  return (
    <button
      tabIndex={0}
      className={kind}
      title={controlText(children)}
      onClick={onClick}
      disabled={disabled || busy}
    >
      {children}
    </button>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <Dumbbell size={28} />
      <p>{children}</p>
    </div>
  );
}
function Header({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <div className="eyebrow">YOUR TRAINING, IN FOCUS</div>
        <h1 tabIndex={-1}>{title}</h1>
        <p>{sub}</p>
      </div>
      <div className="actions">{children}</div>
    </header>
  );
}
function Back({ to, label = "Back" }: { to: string; label?: string }) {
  const { go } = useApp();
  return (
    <button tabIndex={0} className="text-button back" onClick={() => go(to)}>
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
function StartButton({ plan }: { plan?: Plan }) {
  const { data, save, go } = useApp();
  const start = async () => {
    if (data.activeWorkout) {
      go("/workouts/active");
      return;
    }
    const p = plan ?? data.plans.find((x) => x.id === data.activePlanId);
    if (!p) {
      go("/plans");
      return;
    }
    if (
      await save((d) => {
        if (d.activeWorkout)
          throw Error(
            "Finish or discard your current workout before starting another.",
          );
        d.activeWorkout = createWorkout(p, d);
      })
    )
      go("/workouts/active");
  };
  return (
    <Button kind="primary" onClick={start}>
      {data.activeWorkout ? "Resume workout" : "Start workout"}
      <ArrowRight size={17} />
    </Button>
  );
}
function WorkoutList({ items }: { items: Workout[] }) {
  const { go } = useApp();
  return items.length ? (
    <div className="workout-list">
      {items.map((w) => (
        <button
          tabIndex={0}
          key={w.id}
          className="workout-link"
          onClick={() => go("/workouts/" + w.id)}
        >
          <span className="square-icon">
            <Dumbbell size={21} />
          </span>
          <span className="workout-name">
            <strong>{w.name}</strong>
            <small>
              {new Date(w.completedLocalDate + "T12:00:00").toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" },
              )}{" "}
              <span className="dot">·</span> {w.exercises.length} exercises
            </small>
          </span>
          <span className="workout-duration">
            <Clock size={15} />
            {time(duration(w))}
          </span>
          <span className="workout-volume">
            <Weight value={volume(w)} integer />
          </span>
          <ChevronRight size={18} />
        </button>
      ))}
    </div>
  ) : (
    <Empty>No workouts yet. Start your first session.</Empty>
  );
}
function Dashboard() {
  const { data, go } = useApp();
  const s = weeks(data).at(-1)!;
  const p = data.plans.find((p) => p.id === data.activePlanId);
  const start = weekStart(localDate());
  return (
    <>
      <Header title="Dashboard" sub="Make every session count.">
        <StartButton />
      </Header>
      {data.activeWorkout && (
        <div className="notice">
          You have a workout in progress.
          <Button onClick={() => go("/workouts/active")}>
            Resume workout <ArrowRight size={16} />
          </Button>
        </div>
      )}
      <div className="stats">
        <article className="stat">
          <div className="stat-label">
            Workouts this week <Dumbbell size={20} />
          </div>
          <div className="stat-value">
            {s.count}
            <span className="stat-denom"> / {data.preferences.weeklyGoal}</span>
          </div>
          <div className="meter">
            <span
              style={{
                width:
                  Math.min(100, (s.count / data.preferences.weeklyGoal) * 100) +
                  "%",
              }}
            />
          </div>
          <small>
            {Math.max(0, data.preferences.weeklyGoal - s.count) === 0
              ? "Weekly goal reached. Keep showing up."
              : `${Math.max(0, data.preferences.weeklyGoal - s.count)} more to reach your weekly goal`}
          </small>
        </article>
        <article className="stat">
          <div className="stat-label">
            Training volume <ChartNoAxesCombined size={20} />
          </div>
          <div className="stat-value">
            <Weight value={s.volume} integer />
          </div>
          <small>Total external load this week</small>
          <div className="stat-foot">
            Built one rep at a time <ArrowUpRight size={16} />
          </div>
        </article>
        <article className="stat">
          <div className="stat-label">
            Training time <Clock size={20} />
          </div>
          <div className="stat-value">{time(s.seconds)}</div>
          <small>Time invested in yourself</small>
          <div className="stat-foot">
            This week <span>Mon – Sun</span>
          </div>
        </article>
      </div>
      <div className="dashboard-grid">
        <section className="panel active-plan">
          <div className="section-head">
            <h2>Active plan</h2>
            <button
              tabIndex={0}
              className="text-button"
              onClick={() => go("/plans")}
            >
              All plans <ArrowUpRight size={16} />
            </button>
          </div>
          {p ? (
            <>
              <div className="plan-feature">
                <div className="feature-symbol">
                  <Dumbbell size={44} strokeWidth={1.3} />
                </div>
                <div>
                  <span className="tag">
                    {p.isTemplate ? "TEMPLATE" : "CUSTOM PLAN"}
                  </span>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="meta">
                    <span>{p.exercises.length} exercises</span>
                    <span>
                      {p.exercises.reduce((n, e) => n + e.targetSets, 0)} sets
                    </span>
                    <span>{p.days.join(" / ") || "Your schedule"}</span>
                  </div>
                </div>
              </div>
              <div className="plan-preview">
                {p.exercises.slice(0, 3).map((e, i) => (
                  <div key={e.id}>
                    <span className="index">0{i + 1}</span>
                    <span>
                      {data.exercises.find((x) => x.id === e.exerciseId)?.name}
                    </span>
                    <small>
                      {e.targetSets} × {e.targetReps}
                    </small>
                  </div>
                ))}
              </div>
              <div className="panel-bottom">
                <span className="quiet">
                  A little consistency. A stronger you.
                </span>
                <Button onClick={() => go("/plans/" + p.id)}>
                  View plan <ArrowRight size={16} />
                </Button>
              </div>
            </>
          ) : (
            <Empty>
              Choose a plan to make your next session easier.
              <Button onClick={() => go("/plans")}>Choose a plan</Button>
            </Empty>
          )}
        </section>
        <section className="panel weekly">
          <div className="section-head">
            <h2>Weekly activity</h2>
            <CalendarDays size={19} />
          </div>
          <p className="quiet week-range">
            {new Date(start + "T12:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            –{" "}
            {new Date(shiftDay(start, 6) + "T12:00:00").toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric" },
            )}
          </p>
          <div className="week-days">
            {days.map((day, i) => {
              const count = data.workouts.filter(
                (w) => w.completedLocalDate === shiftDay(start, i),
              ).length;
              return (
                <div key={day}>
                  <span>{day.slice(0, 1)}</span>
                  <div
                    className={
                      "day-circle " +
                      (count ? "done" : "") +
                      (shiftDay(start, i) === localDate() ? " today" : "")
                    }
                    role="img"
                    aria-label={`${day}: ${count} workouts`}
                  >
                    {count ? (
                      <Check size={18} />
                    ) : (
                      new Date(shiftDay(start, i) + "T12:00:00").getDate()
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="weekly-message">
            <Target size={24} />
            <div>
              <strong>Progress is a practice.</strong>
              <p>Every session is a step forward.</p>
            </div>
          </div>
          <div className="weekly-total">
            <span>Weekly goal</span>
            <strong>
              {s.count} / {data.preferences.weeklyGoal} workouts
            </strong>
          </div>
        </section>
      </div>
      <section className="panel recent">
        <div className="section-head">
          <div>
            <h2>Recent workouts</h2>
            <p className="quiet">Your effort, on the record.</p>
          </div>
          <button
            tabIndex={0}
            className="text-button"
            onClick={() => go("/workouts")}
          >
            View all <ArrowRight size={16} />
          </button>
        </div>
        <WorkoutList items={sorted(data.workouts).slice(0, 5)} />
      </section>
      <footer className="page-footer">
        <span>Small steps. Lasting strength.</span>
        <span>
          <ShieldCheck size={14} />
          Stored on this device
        </span>
      </footer>
    </>
  );
}
function Workouts() {
  const { data } = useApp();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "",
    range = params.get("range") ?? "all";
  const list = filterHistory(data.workouts, q, range);
  return (
    <>
      <Header title="Workouts" sub="A record of the work you put in.">
        <StartButton />
      </Header>
      <div className="filter-row">
        <label>
          Search workouts
          <input
            value={q}
            placeholder="Search by workout name"
            onChange={(e) => setParams({ q: e.target.value, range })}
          />
        </label>
        <label>
          Time range
          <select
            value={range}
            onChange={(e) => setParams({ q, range: e.target.value })}
          >
            <option value="all">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </label>
      </div>
      <p className="quiet">{list.length} workouts</p>
      <section className="panel">
        {list.length || !data.workouts.length ? (
          <WorkoutList items={list} />
        ) : (
          <Empty>
            No matches found. Try another search or clear your filters.
          </Empty>
        )}
      </section>
    </>
  );
}
function WorkoutDetail() {
  const { id } = useParams();
  const { data, save, go } = useApp();
  const [confirm, setConfirm] = useState(false);
  const w = data.workouts.find((x) => x.id === id);
  if (!w) return <NotFound to="/workouts" />;
  return (
    <>
      <Back to="/workouts" label="All workouts" />
      <Header
        title={w.name}
        sub={`${w.completedLocalDate} · ${time(duration(w))} · ${num(displayWeight(volume(w), units(data)), 0)} ${units(data)} volume`}
      >
        <Button onClick={() => setConfirm(true)} kind="danger-outline">
          <Trash2 size={16} />
          Delete workout
        </Button>
      </Header>
      {w.exercises.map((e) => (
        <section className="panel exercise-panel" key={e.id}>
          <h2>{e.name}</h2>
          <p className="quiet">
            {e.muscleGroup} · {e.equipment}
          </p>
          <table>
            <thead>
              <tr>
                <th>Set</th>
                <th>Weight ({units(data)})</th>
                <th>Reps</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {e.sets.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{num(displayWeight(s.weightKg, units(data)))}</td>
                  <td>{s.reps}</td>
                  <td>
                    <span className="complete-label">
                      <Check size={16} />
                      Complete
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      {confirm && (
        <Confirm
          title="Delete this workout?"
          close={() => setConfirm(false)}
          action="Delete workout"
          onConfirm={async () => {
            if (
              await save((d) => {
                d.workouts = d.workouts.filter((x) => x.id !== id);
              }, "Workout deleted.")
            )
              go("/workouts");
          }}
        >
          This completed workout will be permanently removed. Your statistics
          and records will be recalculated.
        </Confirm>
      )}
    </>
  );
}
function Confirm({
  title,
  children,
  action,
  close,
  onConfirm,
}: {
  title: string;
  children: ReactNode;
  action: string;
  close: () => void;
  onConfirm: () => void;
}) {
  const { busy, error } = useApp();
  return (
    <Modal title={title} close={close} locked={busy}>
      <p>{children}</p>
      <p className="error" aria-live="assertive" aria-atomic="true">
        {error ||
          (repo.conflict
            ? "Data changed in another tab. Reload to continue."
            : "")}
      </p>
      <div className="modal-actions">
        <Button onClick={close}>Cancel</Button>
        <Button kind="primary" disabled={repo.conflict} onClick={onConfirm}>
          {action}
        </Button>
      </div>
    </Modal>
  );
}
function NotFound({ to = "/" }: { to?: string }) {
  const { go } = useApp();
  return (
    <>
      <Header title="Not found" sub="This item could not be found." />
      <Button onClick={() => go(to)}>
        Back to {to === "/" ? "Dashboard" : "list"}
      </Button>
    </>
  );
}
function ExerciseBrowser({ select }: { select?: (e: Exercise) => void }) {
  const { data, go } = useApp();
  const [q, Q] = useState(""),
    [muscle, M] = useState("All"),
    [gear, G] = useState("All"),
    [detail, D] = useState<Exercise | null>(null);
  const list = data.exercises.filter(
    (e) =>
      [e.name, ...e.aliases]
        .join(" ")
        .toLowerCase()
        .includes(q.trim().toLowerCase()) &&
      (muscle === "All" || e.muscleGroup === muscle) &&
      (gear === "All" || e.equipment === gear),
  );
  return (
    <>
      <div className="filter-row">
        <label>
          Search exercises
          <input
            value={q}
            onChange={(e) => Q(e.target.value)}
            placeholder="Search name or alias"
          />
        </label>
        <label>
          Muscle group
          <select value={muscle} onChange={(e) => M(e.target.value)}>
            {["All", ...muscles].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Equipment
          <select value={gear} onChange={(e) => G(e.target.value)}>
            {["All", ...equipment].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="section-head">
        <p className="quiet">{list.length} exercises</p>
        <button
          tabIndex={0}
          className="text-button"
          onClick={() => {
            Q("");
            M("All");
            G("All");
          }}
        >
          Clear filters
        </button>
      </div>
      <div className="exercise-grid">
        {list.map((e) => (
          <article className="panel exercise-card" key={e.id}>
            <div className="square-icon">
              <Dumbbell size={24} />
            </div>
            <h2>{e.name}</h2>
            <p>
              {e.muscleGroup} · {e.equipment}
            </p>
            <div className="actions">
              <Button
                onClick={() => (select ? D(e) : go("/exercises/" + e.id))}
              >
                View details <ArrowUpRight size={15} />
              </Button>
              {select && (
                <Button kind="primary" onClick={() => select(e)}>
                  Select
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!list.length && (
        <Empty>
          No matches found. Try another search or clear your filters.
        </Empty>
      )}
      {detail && (
        <Modal title={detail.name} close={() => D(null)}>
          <ExerciseInfo e={detail} />
          <Button kind="primary" onClick={() => select?.(detail)}>
            Select exercise
          </Button>
        </Modal>
      )}
    </>
  );
}
function ExerciseInfo({ e }: { e: Exercise }) {
  return (
    <>
      <p className="quiet">
        {e.muscleGroup} · {e.equipment}
      </p>
      <h3>How to perform</h3>
      <ol className="instructions">
        {e.instructions.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ol>
      <div className="notice">{e.note}</div>
    </>
  );
}
function ExerciseDetail() {
  const { data } = useApp();
  const { id } = useParams();
  const e = data.exercises.find((x) => x.id === id);
  if (!e) return <NotFound to="/exercises" />;
  return (
    <>
      <Back to="/exercises" label="All exercises" />
      <Header title={e.name} sub="Move with purpose. Build with care." />
      <section className="panel detail-panel">
        <ExerciseInfo e={e} />
      </section>
    </>
  );
}
function Plans() {
  const { data, go } = useApp();
  return (
    <>
      <Header title="Plans" sub="A little structure for your next step.">
        <Button kind="primary" onClick={() => go("/plans/new")}>
          <Plus size={17} />
          Create plan
        </Button>
      </Header>
      <div className="section-head">
        <h2>Your training plans</h2>
        <span className="quiet">{data.plans.length} plans</span>
      </div>
      <div className="plan-grid">
        {data.plans.map((p, i) => (
          <article key={p.id} className="panel plan-card">
            <div className="plan-card-art">
              <Dumbbell size={56} strokeWidth={1} />
              <span>0{i + 1}</span>
            </div>
            <div className="plan-card-content">
              <div className="section-head">
                <span className="tag">
                  {p.isTemplate ? "TEMPLATE" : "CUSTOM"}
                </span>
                {data.activePlanId === p.id && (
                  <span className="active-tag">
                    <Check size={13} />
                    Active
                  </span>
                )}
              </div>
              <h2>{p.name}</h2>
              <p>{p.description}</p>
              <div className="meta">
                <span>{p.exercises.length} exercises</span>
                <span>{p.days.join(" / ") || "Flexible"}</span>
              </div>
              <Button onClick={() => go("/plans/" + p.id)}>
                View plan <ArrowRight size={16} />
              </Button>
            </div>
          </article>
        ))}
      </div>
      {!data.plans.length && <Empty>Build a plan that works for you.</Empty>}
    </>
  );
}
function PlanDetail() {
  const { id } = useParams();
  const { data, save, go } = useApp();
  const [del, D] = useState(false);
  const p = data.plans.find((x) => x.id === id);
  if (!p) return <NotFound to="/plans" />;
  return (
    <>
      <Back to="/plans" label="All plans" />
      <Header title={p.name} sub={p.description}>
        <StartButton plan={p} />
      </Header>
      <div className="actions spaced">
        <span className="tag">{p.isTemplate ? "TEMPLATE" : "CUSTOM PLAN"}</span>
        <span>{p.days.join(" · ")}</span>
        <Button
          onClick={() =>
            void save((d) => {
              d.activePlanId = p.id;
            }, "Active plan updated.")
          }
          disabled={data.activePlanId === p.id}
        >
          {data.activePlanId === p.id ? "Active plan" : "Use plan"}
        </Button>
        <Button
          onClick={async () => {
            const copy = {
              ...structuredClone(p),
              id: uuid(),
              name: (p.name + " copy").slice(0, 60),
              isTemplate: false,
              exercises: p.exercises.map((e) => ({ ...e, id: uuid() })),
            };
            if (
              await save((d) => {
                d.plans.push(copy);
              })
            )
              go("/plans/" + copy.id + "/edit");
          }}
        >
          <Copy size={16} />
          Copy plan
        </Button>
        {!p.isTemplate && (
          <>
            <Button onClick={() => go("/plans/" + p.id + "/edit")}>
              Edit plan
            </Button>
            <Button kind="danger-outline" onClick={() => D(true)}>
              Delete plan
            </Button>
          </>
        )}
      </div>
      <section className="panel">
        {p.exercises.map((r, i) => {
          const e = data.exercises.find((x) => x.id === r.exerciseId)!;
          return (
            <div className="plan-row" key={r.id}>
              <span className="index">{String(i + 1).padStart(2, "0")}</span>
              <div className="grow">
                <button
                  tabIndex={0}
                  className="text-button"
                  onClick={() => go("/exercises/" + e.id)}
                >
                  <strong>{e.name}</strong>
                  <ArrowUpRight size={14} />
                </button>
                <small>
                  {e.muscleGroup} · {e.equipment}
                </small>
              </div>
              <div>
                <strong>
                  {r.targetSets} × {r.targetReps}
                </strong>
                <small>
                  <Weight value={r.targetWeightKg} /> · {r.restSeconds}s rest
                </small>
              </div>
            </div>
          );
        })}
      </section>
      {del && (
        <Confirm
          title="Delete this plan?"
          action="Delete plan"
          close={() => D(false)}
          onConfirm={async () => {
            if (
              await save((d) => {
                d.plans = d.plans.filter((x) => x.id !== p.id);
                if (d.activePlanId === p.id) d.activePlanId = null;
              }, "Plan deleted.")
            )
              go("/plans");
          }}
        >
          Your custom plan will be permanently removed. Existing workout
          snapshots will remain.
        </Confirm>
      )}
    </>
  );
}
function PlanEditor() {
  const { id } = useParams();
  const { data, save, go, dirty } = useApp();
  const original = data.plans.find((x) => x.id === id);
  const [plan, P] = useState<Plan>(() =>
    original
      ? structuredClone(original)
      : {
          id: uuid(),
          name: "",
          description: "",
          isTemplate: false,
          days: [],
          exercises: [],
        },
  );
  const [picker, S] = useState(false);
  const [error, E] = useState("");
  useEffect(
    () => () => {
      dirty.current = false;
    },
    [dirty],
  );
  if (id && (!original || original.isTemplate)) return <NotFound to="/plans" />;
  const edit = (f: (p: Plan) => void) => {
    P((p) => {
      const n = structuredClone(p);
      f(n);
      return n;
    });
    dirty.current = true;
  };
  const valid = planSchema.safeParse(plan).success;
  return (
    <>
      <Back to="/plans" label="All plans" />
      <Header
        title={id ? "Edit plan" : "Create plan"}
        sub="Make a plan that works for you."
      >
        <Button
          kind="primary"
          disabled={!valid}
          onClick={async () => {
            if (
              await save((d) => {
                const i = d.plans.findIndex((x) => x.id === plan.id);
                if (i < 0) d.plans.push(plan);
                else d.plans[i] = plan;
              }, "Plan saved.")
            ) {
              dirty.current = false;
              go("/plans/" + plan.id);
            }
          }}
        >
          Save plan
        </Button>
      </Header>
      <section className="panel editor">
        <label>
          Plan name
          <input
            maxLength={60}
            value={plan.name}
            onChange={(e) =>
              edit((p) => {
                p.name = e.target.value;
              })
            }
          />
        </label>
        {!plan.name.trim() && (
          <small className="error">
            A plan name is required (1–60 characters).
          </small>
        )}
        <label>
          Description
          <textarea
            maxLength={500}
            value={plan.description}
            onChange={(e) =>
              edit((p) => {
                p.description = e.target.value;
              })
            }
          />
        </label>
        <fieldset>
          <legend>
            Training days{" "}
            <span className="quiet">— labels for your routine</span>
          </legend>
          <div className="actions">
            {days.map((day) => (
              <button
                tabIndex={0}
                key={day}
                aria-pressed={plan.days.includes(day)}
                className={plan.days.includes(day) ? "selected" : ""}
                onClick={() =>
                  edit((p) => {
                    p.days = p.days.includes(day)
                      ? p.days.filter((x) => x !== day)
                      : [...p.days, day];
                  })
                }
              >
                {day}
              </button>
            ))}
          </div>
        </fieldset>
      </section>
      <h2>Exercises</h2>
      {plan.exercises.map((r, i) => (
        <section className="panel editor" key={r.id}>
          <div className="section-head">
            <h3>
              {i + 1}. {data.exercises.find((e) => e.id === r.exerciseId)?.name}
            </h3>
            <div className="actions">
              <Button
                disabled={i === 0}
                onClick={() =>
                  edit((p) => {
                    [p.exercises[i - 1], p.exercises[i]] = [
                      p.exercises[i],
                      p.exercises[i - 1],
                    ];
                  })
                }
              >
                <MoveUp size={16} />
                <span className="sr-only">Move up</span>
              </Button>
              <Button
                disabled={i === plan.exercises.length - 1}
                onClick={() =>
                  edit((p) => {
                    [p.exercises[i + 1], p.exercises[i]] = [
                      p.exercises[i],
                      p.exercises[i + 1],
                    ];
                  })
                }
              >
                <MoveDown size={16} />
                <span className="sr-only">Move down</span>
              </Button>
              <Button
                onClick={() =>
                  edit((p) => {
                    p.exercises.splice(i, 1);
                  })
                }
              >
                <Trash2 size={16} />
                <span className="sr-only">Remove exercise</span>
              </Button>
            </div>
          </div>
          <div className="target-fields">
            {(
              [
                "targetSets",
                "targetReps",
                "targetWeightKg",
                "restSeconds",
              ] as const
            ).map((key) => (
              <label key={key}>
                {
                  {
                    targetSets: "Sets (1–20)",
                    targetReps: "Reps (1–100)",
                    targetWeightKg: `Weight (${units(data)})`,
                    restSeconds: "Rest (15–600s)",
                  }[key]
                }
                <input
                  inputMode="decimal"
                  defaultValue={
                    key === "targetWeightKg"
                      ? num(displayWeight(r[key], units(data))).replaceAll(
                          ",",
                          "",
                        )
                      : r[key]
                  }
                  onChange={(e) => {
                    dirty.current = true;
                    try {
                      const limits = {
                        targetSets: [1, 20],
                        targetReps: [1, 100],
                        targetWeightKg: [0, displayWeight(500, units(data))],
                        restSeconds: [15, 600],
                      }[key];
                      const n = numeric(
                        e.target.value,
                        limits[0],
                        limits[1],
                        key !== "targetWeightKg",
                      );
                      edit((p) => {
                        p.exercises[i][key] =
                          key === "targetWeightKg"
                            ? canonicalWeight(n, units(data))
                            : n;
                      });
                      e.target.setCustomValidity("");
                      E("");
                    } catch (err) {
                      edit((p) => {
                        p.exercises[i][key] = NaN;
                      });
                      e.target.setCustomValidity("Invalid value");
                      E((err as Error).message);
                    }
                  }}
                />
              </label>
            ))}
          </div>
        </section>
      ))}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!plan.exercises.length && (
        <p className="quiet">Add at least one exercise to save this plan.</p>
      )}
      <Button disabled={plan.exercises.length >= 30} onClick={() => S(true)}>
        <Plus size={17} />
        Add exercise
      </Button>
      {picker && (
        <Modal title="Add exercise to plan" close={() => S(false)}>
          <ExerciseBrowser
            select={(e) => {
              edit((p) => {
                p.exercises.push({
                  id: uuid(),
                  exerciseId: e.id,
                  targetSets: 3,
                  targetReps: 10,
                  targetWeightKg: 0,
                  restSeconds: 90,
                });
              });
              S(false);
            }}
          />
        </Modal>
      )}
    </>
  );
}
function SetLine({
  s,
  index,
  rowId,
  onDirty,
}: {
  s: SetRecord;
  index: number;
  rowId: string;
  onDirty: (id: string, dirty: boolean) => void;
}) {
  const { data, save, busy } = useApp();
  const unit = units(data);
  const [weight, W] = useState(
    String(+displayWeight(s.weightKg, unit).toFixed(2)),
  );
  const [reps, R] = useState(String(s.reps));
  const [error, E] = useState("");
  const committedWeight = useRef(s.weightKg);
  const changed = useRef(false);
  const version = useRef(0);
  const weightChanged = useRef(false);
  const lastUnit = useRef(unit);
  useEffect(() => {
    committedWeight.current = s.weightKg;
    if (lastUnit.current !== unit && !changed.current) {
      W(String(+displayWeight(s.weightKg, unit).toFixed(2)));
      R(String(s.reps));
      lastUnit.current = unit;
    }
  }, [s.weightKg, s.reps, unit]);
  const submit = async (done?: boolean) => {
    const submittedVersion = version.current;
    try {
      const weightKg = weightChanged.current
        ? weightInput(weight, 0, 500, unit)
        : committedWeight.current;
      const n = numeric(reps, 1, 100, true);
      const ok = await save(
        (d) => {
          const e = d.activeWorkout!.exercises.find((x) => x.id === rowId)!;
          const set = e.sets.find((x) => x.id === s.id)!;
          set.weightKg = weightKg;
          set.reps = n;
          if (done !== undefined) {
            set.completed = done;
            if (done)
              d.activeWorkout!.rest = {
                durationSeconds: e.restSeconds,
                endsAt: new Date(
                  Date.now() + e.restSeconds * 1000,
                ).toISOString(),
              };
          }
        },
        undefined,
        done === undefined,
      );
      if (ok) committedWeight.current = weightKg;
      if (ok && submittedVersion === version.current) {
        changed.current = false;
        weightChanged.current = false;
        onDirty(s.id, false);
        E("");
      }
      return ok;
    } catch (err) {
      E((err as Error).message);
      return false;
    }
  };
  return (
    <>
      <div className={"set-row " + (s.completed ? "set-done" : "")}>
        <span className="set-number">{String(index + 1).padStart(2, "0")}</span>
        <input
          aria-label={`Set ${index + 1} weight (${unit})`}
          inputMode="decimal"
          value={weight}
          aria-invalid={!!error}
          onChange={(e) => {
            W(e.target.value);
            version.current++;
            weightChanged.current = true;
            changed.current = true;
            onDirty(s.id, true);
          }}
          onBlur={() => {
            if (changed.current) void submit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
        />
        <input
          aria-label={`Set ${index + 1} reps`}
          inputMode="numeric"
          value={reps}
          aria-invalid={!!error}
          onChange={(e) => {
            R(e.target.value);
            version.current++;
            changed.current = true;
            onDirty(s.id, true);
          }}
          onBlur={() => {
            if (changed.current) void submit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
        />
        <button
          tabIndex={0}
          aria-label={`Set ${index + 1} done`}
          disabled={busy}
          title={s.completed ? "Mark set incomplete" : "Complete set"}
          aria-pressed={s.completed}
          className={"done-button " + (s.completed ? "selected" : "")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => void submit(!s.completed)}
        >
          <Check size={19} />
          <span className="sr-only">Done</span>
        </button>
        <Button
          kind="icon-button"
          onClick={async () => {
            if (
              await save((d) => {
                const e = d.activeWorkout!.exercises.find(
                  (x) => x.id === rowId,
                )!;
                e.sets = e.sets.filter((x) => x.id !== s.id);
              })
            ) {
              onDirty(s.id, false);
            }
          }}
        >
          <X size={17} />
          <span className="sr-only">Remove set {index + 1}</span>
        </Button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
function Recorder() {
  const { data, save, go, dirty } = useApp();
  const a = data.activeWorkout;
  const [picker, P] = useState<string | null>(null),
    [replace, RP] = useState<{ id: string; e: Exercise } | null>(null),
    [confirm, C] = useState("");
  const [drafts, D] = useState<Set<string>>(new Set());
  const draftIds = useRef(new Set<string>());
  const mounted = useRef(true);
  const [rest, RS] = useState(a?.rest?.durationSeconds ?? 90);
  useEffect(() => {
    if (a?.rest) RS(a.rest.durationSeconds);
  }, [a?.rest?.durationSeconds]);
  const setDirty = (id: string, value: boolean) => {
    if (!mounted.current) return;
    const next = new Set(draftIds.current);
    if (value) next.add(id);
    else next.delete(id);
    draftIds.current = next;
    dirty.current = next.size > 0;
    D(next);
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      dirty.current = false;
    };
  }, [dirty]);
  if (!a)
    return (
      <>
        <Header title="Current workout" sub="Ready when you are." />
        <StartButton />
      </>
    );
  const update = (f: (a: Active) => void) =>
    save((d) => {
      f(d.activeWorkout!);
    });
  const changeExercise = async (id: string, e: Exercise) => {
    const replacedSetIds =
      a.exercises.find((row) => row.id === id)?.sets.map((set) => set.id) ?? [];
    if (
      await update((a) => {
        const i = a.exercises.findIndex((x) => x.id === id);
        a.exercises[i] = makeRow(e);
      })
    ) {
      replacedSetIds.forEach((id) => setDirty(id, false));
      RP(null);
      P(null);
    }
  };
  const completed = a.exercises
    .flatMap((e) => e.sets)
    .filter((s) => s.completed).length;
  return (
    <>
      <Back to="/workouts" label="All workouts" />
      <Header
        title={a.name}
        sub="Focus on the next rep. We'll keep the record."
      >
        <LiveTimer startedAt={a.startedAt} rest={a.rest} />
      </Header>
      <div className="recorder-layout">
        <div>
          {a.exercises.map((e) => (
            <section key={e.id} className="panel exercise-panel">
              <div className="section-head">
                <div>
                  <h2>{e.name}</h2>
                  <p className="quiet">
                    {e.muscleGroup} · {e.equipment}
                  </p>
                </div>
                <div className="actions">
                  <Button onClick={() => P(e.id)}>Replace</Button>
                  <Button
                    kind="icon-button"
                    onClick={async () => {
                      if (
                        await update((a) => {
                          a.exercises = a.exercises.filter(
                            (x) => x.id !== e.id,
                          );
                        })
                      ) {
                        e.sets.forEach((s) => setDirty(s.id, false));
                      }
                    }}
                  >
                    <Trash2 size={17} />
                    <span className="sr-only">Remove {e.name}</span>
                  </Button>
                </div>
              </div>
              <div className="set-row set-head">
                <span>Set</span>
                <span>Weight ({units(data)})</span>
                <span>Reps</span>
                <span>Done</span>
                <span />
              </div>
              {e.sets.map((s, i) => (
                <SetLine
                  key={s.id}
                  s={s}
                  index={i}
                  rowId={e.id}
                  onDirty={setDirty}
                />
              ))}
              <Button
                kind="text-button add-set"
                disabled={e.sets.length >= 20}
                onClick={() =>
                  void update((a) => {
                    const row = a.exercises.find((x) => x.id === e.id)!;
                    const last = row.sets.at(-1);
                    row.sets.push({
                      id: uuid(),
                      weightKg: last?.weightKg ?? 0,
                      reps: last?.reps ?? 8,
                      completed: false,
                    });
                  })
                }
              >
                <Plus size={16} />
                Add set
              </Button>
            </section>
          ))}
          <Button disabled={a.exercises.length >= 30} onClick={() => P("add")}>
            <Plus size={18} />
            Add exercise
          </Button>
          <div className="finish-bar">
            <div>
              <strong>{completed} completed sets</strong>
              <p className="quiet">
                {drafts.size
                  ? "Unsaved changes — finish editing your sets."
                  : "All committed changes are saved on this device."}
              </p>
            </div>
            <Button
              kind="primary"
              disabled={!completed || drafts.size > 0}
              onClick={() => C("finish")}
            >
              Finish workout <Check size={18} />
            </Button>
          </div>
          {!completed && (
            <p className="quiet">
              Complete at least one set to finish this workout.
            </p>
          )}
        </div>
        <aside className="panel rest-panel">
          <Clock size={24} />
          <h2>Rest timer</h2>
          <p>Take a breath. Come back stronger.</p>
          <label>
            Duration
            <select value={rest} onChange={(e) => RS(+e.target.value)}>
              {[...new Set([30, 60, 90, 120, 180, rest])]
                .sort((a, b) => a - b)
                .map((s) => (
                  <option key={s} value={s}>
                    {s} seconds
                  </option>
                ))}
            </select>
          </label>
          <Button
            onClick={() =>
              void update((a) => {
                a.rest = {
                  durationSeconds: rest,
                  endsAt: new Date(Date.now() + rest * 1000).toISOString(),
                };
              })
            }
          >
            {a.rest ? "Restart timer" : "Start rest"}
          </Button>
          {a.rest && (
            <Button
              onClick={() =>
                void update((a) => {
                  a.rest = null;
                })
              }
            >
              Skip rest
            </Button>
          )}
          <hr />
          <small>
            Weight uses external load. Bodyweight is not included in training
            volume.
          </small>
          <Button kind="danger-outline" onClick={() => C("discard")}>
            Discard workout
          </Button>
        </aside>
      </div>
      {picker && (
        <Modal
          title={picker === "add" ? "Add exercise" : "Replace exercise"}
          close={() => P(null)}
        >
          <ExerciseBrowser
            select={(e) => {
              if (picker === "add") {
                void update((a) => {
                  a.exercises.push(makeRow(e));
                }).then((ok) => {
                  if (ok) P(null);
                });
              } else if (
                a.exercises
                  .find((x) => x.id === picker)
                  ?.sets.some((s) => s.completed)
              ) {
                RP({ id: picker, e });
                P(null);
              } else void changeExercise(picker, e);
            }}
          />
        </Modal>
      )}
      {replace && (
        <Confirm
          title="Replace recorded exercise?"
          action="Replace exercise"
          close={() => RP(null)}
          onConfirm={() => void changeExercise(replace.id, replace.e)}
        >
          Replacing this exercise will clear its sets and recorded values.
        </Confirm>
      )}
      {confirm && (
        <Confirm
          title={
            confirm === "finish"
              ? "Finish this workout?"
              : "Discard this workout?"
          }
          action={confirm === "finish" ? "Save workout" : "Discard workout"}
          close={() => C("")}
          onConfirm={async () => {
            const id = a.id;
            if (
              await save(
                (d) => {
                  if (confirm === "finish") finish(d);
                  else d.activeWorkout = null;
                },
                confirm === "finish"
                  ? "Workout saved. Nice work."
                  : "Workout discarded.",
              )
            ) {
              dirty.current = false;
              go(confirm === "finish" ? "/workouts/" + id : "/workouts");
            }
          }}
        >
          {confirm === "finish" ? (
            <>
              {completed} completed sets · <Weight value={volume(a)} integer />{" "}
              ·{" "}
              {time(
                Math.max(
                  0,
                  Math.floor((Date.now() - Date.parse(a.startedAt)) / 1000),
                ),
              )}
              . Only completed sets will be saved.
              {Date.now() - Date.parse(a.startedAt) > 86400000 && (
                <p>This workout has been running for over 24 hours.</p>
              )}
            </>
          ) : (
            "Your current workout will be permanently removed."
          )}
        </Confirm>
      )}
    </>
  );
}
function Progress() {
  const { data, save, dirty } = useApp();
  useEffect(
    () => () => {
      dirty.current = false;
    },
    [dirty],
  );
  const [metric, M] = useState("count"),
    [date, D] = useState(localDate()),
    [weight, W] = useState(""),
    [error, E] = useState(""),
    [pending, P] = useState<{
      id: string;
      date: string;
      weightKg: number;
    } | null>(null),
    [deletion, DEL] = useState<string | null>(null);
  const originalWeight = useRef<{ unit: string; kg: number } | null>(null);
  const weightEdited = useRef(false);
  const rows = weeks(data),
    pr = records(data),
    max = Math.max(
      1,
      ...rows.map((x) =>
        metric === "count" ? x.count : displayWeight(x.volume, units(data)),
      ),
    );
  const sortedBody = [...data.bodyWeights].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const write = async (entry: NonNullable<typeof pending>) => {
    if (
      await save((d) => {
        const i = d.bodyWeights.findIndex((b) => b.date === entry.date);
        if (i < 0) d.bodyWeights.push(entry);
        else d.bodyWeights[i] = entry;
      }, "Weight saved.")
    ) {
      dirty.current = false;
      originalWeight.current = null;
      weightEdited.current = false;
      P(null);
      W("");
      E("");
    }
  };
  return (
    <>
      <Header title="Progress" sub="See how far you've come. Last 8 weeks." />
      <section className="panel trend-panel">
        <div className="section-head">
          <div>
            <h2>Consistency adds up</h2>
            <p className="quiet">
              {metric === "count"
                ? "Completed workouts"
                : "Training volume (" + units(data) + ")"}{" "}
              · weekly totals
            </p>
          </div>
          <div className="segmented">
            <button
              tabIndex={0}
              aria-pressed={metric === "count"}
              onClick={() => M("count")}
            >
              Workouts
            </button>
            <button
              tabIndex={0}
              aria-pressed={metric === "volume"}
              onClick={() => M("volume")}
            >
              Volume
            </button>
          </div>
        </div>
        <div
          className="bar-chart"
          role="img"
          aria-label="Weekly training trend"
        >
          {rows.map((r) => {
            const value =
              metric === "count"
                ? r.count
                : displayWeight(r.volume, units(data));
            return (
              <div key={r.date} className="bar-column">
                <span>{num(value, 0)}</span>
                <div className="bar-track">
                  <div
                    className="bar"
                    style={{
                      height:
                        Math.max(value ? 3 : 0, (value / max) * 100) + "%",
                    }}
                  />
                </div>
                <small>{r.date.slice(5)}</small>
              </div>
            );
          })}
        </div>
        {!data.workouts.length && (
          <p>Complete a workout to see your progress.</p>
        )}
        <details>
          <summary>View trend data</summary>
          <table>
            <thead>
              <tr>
                <th>Week of</th>
                <th>Workouts</th>
                <th>Volume ({units(data)})</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date}>
                  <td>{r.date}</td>
                  <td>{r.count}</td>
                  <td>{num(displayWeight(r.volume, units(data)), 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>
      <section className="panel">
        <div className="section-head">
          <h2>Personal records</h2>
          <span className="quiet">Every rep earned</span>
        </div>
        {pr.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Exercise</th>
                  <th>Highest external load</th>
                  <th>Best set volume</th>
                </tr>
              </thead>
              <tbody>
                {pr.map((r) => (
                  <tr key={r.exercise.id}>
                    <td>
                      <strong>{r.exercise.name}</strong>
                      <small>{r.weight.date}</small>
                    </td>
                    <td>
                      <Weight value={r.weight.weight} />
                    </td>
                    <td>
                      <Weight value={r.volume.volume} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Complete a workout to see your personal records.</Empty>
        )}
      </section>
      <section className="panel">
        <div className="section-head">
          <h2>Body weight</h2>
          <span className="tag">{units(data).toUpperCase()}</span>
        </div>
        <form
          className="filter-row weight-form"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              if (
                !date ||
                date > localDate() ||
                new Date(date + "T12:00:00Z").toISOString().slice(0, 10) !==
                  date
              )
                throw Error("Choose today or an earlier date.");
              const n =
                originalWeight.current &&
                !weightEdited.current &&
                originalWeight.current.unit === units(data)
                  ? originalWeight.current.kg
                  : weightInput(weight, 20, 350, units(data));
              const old = data.bodyWeights.find((b) => b.date === date);
              const entry = { id: old?.id ?? uuid(), date, weightKg: n };
              if (old) P(entry);
              else void write(entry);
            } catch (err) {
              E((err as Error).message);
            }
          }}
        >
          <label>
            Date
            <input
              type="date"
              max={localDate()}
              required
              value={date}
              onChange={(e) => {
                D(e.target.value);
                dirty.current = true;
              }}
            />
          </label>
          <label>
            Weight ({units(data)})
            <input
              inputMode="decimal"
              required
              value={weight}
              onChange={(e) => {
                W(e.target.value);
                weightEdited.current = true;
                dirty.current = true;
              }}
            />
          </label>
          <button tabIndex={0} className="primary" type="submit">
            <Plus size={17} />
            Log weight
          </button>
        </form>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {sortedBody.length > 1 && (
          <svg
            className="body-chart"
            viewBox="0 0 800 120"
            role="img"
            aria-label="Body weight trend; exact values are in the weight history table"
          >
            <line x1="24" y1="96" x2="776" y2="96" stroke="#DCE2DE" />
            {sortedBody.map((b, i) => {
              const x = 24 + (i / (sortedBody.length - 1)) * 752;
              const min = Math.min(...sortedBody.map((x) => x.weightKg)) - 0.5,
                max = Math.max(...sortedBody.map((x) => x.weightKg)) + 0.5;
              const y = 96 - ((b.weightKg - min) / (max - min)) * 72;
              const prev = sortedBody[i - 1];
              const py = prev
                ? 96 - ((prev.weightKg - min) / (max - min)) * 72
                : y;
              return (
                <g key={b.id}>
                  {prev && (
                    <line
                      x1={24 + ((i - 1) / (sortedBody.length - 1)) * 752}
                      y1={py}
                      x2={x}
                      y2={y}
                      stroke="#1D6B46"
                      strokeWidth="2"
                    />
                  )}
                  <circle cx={x} cy={y} r="4" fill="#1D6B46" />
                </g>
              );
            })}
          </svg>
        )}
        <h3>Weight history</h3>
        {sortedBody.length ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight ({units(data)})</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...sortedBody].reverse().map((b) => (
                <tr key={b.id}>
                  <td>{b.date}</td>
                  <td>{num(displayWeight(b.weightKg, units(data)))}</td>
                  <td>
                    <div className="actions">
                      <Button
                        onClick={() => {
                          originalWeight.current = {
                            unit: units(data),
                            kg: b.weightKg,
                          };
                          weightEdited.current = false;
                          D(b.date);
                          W(
                            String(
                              +displayWeight(b.weightKg, units(data)).toFixed(
                                2,
                              ),
                            ),
                          );
                        }}
                      >
                        Edit
                      </Button>
                      <Button kind="icon-button" onClick={() => DEL(b.id)}>
                        <Trash2 size={16} />
                        <span className="sr-only">Delete weight entry</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>Log your first weight entry to see your trend.</Empty>
        )}
      </section>
      {pending && (
        <Confirm
          title="Replace weight entry?"
          action="Replace entry"
          close={() => P(null)}
          onConfirm={() => void write(pending)}
        >
          A weight entry already exists for this date. Replace it?
        </Confirm>
      )}
      {deletion && (
        <Confirm
          title="Delete weight entry?"
          action="Delete entry"
          close={() => DEL(null)}
          onConfirm={async () => {
            if (
              await save((d) => {
                d.bodyWeights = d.bodyWeights.filter((b) => b.id !== deletion);
              }, "Weight entry deleted.")
            )
              DEL(null);
          }}
        >
          This weight entry will be permanently removed.
        </Confirm>
      )}
    </>
  );
}
function download(raw: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([raw], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Settings() {
  const { data, save, dirty } = useApp();
  useEffect(
    () => () => {
      dirty.current = false;
    },
    [dirty],
  );
  const [preview, P] = useState<Data | null>(null),
    [error, E] = useState(""),
    [clear, C] = useState(false),
    [text, T] = useState("");
  const [goal, G] = useState(String(data.preferences.weeklyGoal));
  const file = useRef<HTMLInputElement>(null);
  return (
    <>
      <Header
        title="Settings"
        sub="Your training. Your preferences. Your data."
      />
      <div className="settings-content">
        <section className="panel">
          <h2>Preferences</h2>
          <p className="quiet">Make FORMA feel right for you.</p>
          <div className="setting-row">
            <div>
              <strong>Weight unit</strong>
              <p>Used for external load and body weight.</p>
            </div>
            <label>
              <span className="sr-only">Weight unit</span>
              <select
                value={units(data)}
                onChange={(e) => {
                  const value = e.target.value as "kg" | "lb";
                  void save((d) => {
                    d.preferences.weightUnit = value;
                  }, "Preferences saved.");
                }}
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="lb">Pounds (lb)</option>
              </select>
            </label>
          </div>
          <div className="setting-row">
            <div>
              <strong>Length unit</strong>
              <p>Your preferred measurement system.</p>
            </div>
            <label>
              <span className="sr-only">Length unit</span>
              <select
                value={data.preferences.lengthUnit}
                onChange={(e) => {
                  const value = e.target.value as "cm" | "in";
                  void save((d) => {
                    d.preferences.lengthUnit = value;
                  }, "Preferences saved.");
                }}
              >
                <option value="cm">Centimeters (cm)</option>
                <option value="in">Inches (in)</option>
              </select>
            </label>
          </div>
          <form
            className="setting-row"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const n = numeric(goal, 1, 14, true);
                void save((d) => {
                  d.preferences.weeklyGoal = n;
                }, "Weekly goal saved.").then((ok) => {
                  if (ok) dirty.current = false;
                });
                E("");
              } catch (err) {
                E((err as Error).message);
              }
            }}
          >
            <label>
              Weekly workout goal
              <small>Choose a target from 1 to 14 workouts.</small>
            </label>
            <div className="actions">
              <input
                className="goal-input"
                aria-label="Weekly workout goal"
                inputMode="numeric"
                value={goal}
                onChange={(e) => {
                  G(e.target.value);
                  dirty.current = true;
                }}
              />
              <button tabIndex={0} type="submit">
                Save goal
              </button>
            </div>
          </form>
        </section>
        <section className="panel">
          <h2>Local data</h2>
          <p>
            Your data is stored in this browser on this device. Clearing browser
            data may remove it. Export a backup to keep a copy.
          </p>
          <div className="notice">
            <ShieldCheck size={20} />
            <span>No account. No cloud sync. Your training stays here.</span>
          </div>
          {data.workouts.some((w) => w.id === "workout-upper-001") && (
            <p className="quiet">Demo data is loaded on this device.</p>
          )}
          <div className="setting-row">
            <div>
              <strong>Export a backup</strong>
              <p>Download all your data as a JSON file.</p>
            </div>
            <Button
              onClick={() => {
                try {
                  download(
                    repo.exportBackup(),
                    `forma-backup-${localDate()}.json`,
                  );
                } catch (err) {
                  E((err as Error).message);
                }
              }}
            >
              <Download size={17} />
              Export data
            </Button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Restore from a backup</strong>
              <p>Importing will replace all data on this device.</p>
            </div>
            <Button onClick={() => file.current?.click()}>
              <Upload size={17} />
              Import data
            </Button>
            <input
              ref={file}
              className="sr-only"
              aria-label="Import JSON backup"
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  if (f.size > 2 * 1024 * 1024)
                    throw Error("The file exceeds 2 MiB.");
                  P(parseBackup(await f.text()));
                  E("");
                } catch (err) {
                  E(
                    err instanceof Error && err.message.includes("unsupported")
                      ? err.message
                      : "Invalid backup. Check the JSON structure, ranges, dates and references.",
                  );
                }
                e.target.value = "";
              }}
            />
          </div>
        </section>
        <section className="panel danger-zone">
          <h2>Danger zone</h2>
          <div className="setting-row">
            <div>
              <strong>Clear personal data</strong>
              <p>Remove workouts, custom plans and weight entries.</p>
            </div>
            <Button
              kind="danger-outline"
              onClick={() => {
                C(true);
                T("");
              }}
            >
              Clear personal data
            </Button>
          </div>
        </section>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
      {preview && (
        <Confirm
          title="Import backup?"
          action="Replace all data"
          close={() => P(null)}
          onConfirm={async () => {
            if (
              await save((d) => {
                Object.assign(d, parseBackup(JSON.stringify(preview)));
              }, "Backup imported.")
            ) {
              G(String(preview.preferences.weeklyGoal));
              dirty.current = false;
              P(null);
            }
          }}
        >
          <span>Importing will replace all data on this device.</span>
          <span className="import-summary">
            {preview.workouts.length} workouts · {preview.plans.length} plans ·{" "}
            {preview.exercises.length} exercises · {preview.bodyWeights.length}{" "}
            weight entries
            <br />
            {preview.activeWorkout
              ? "Includes an active workout."
              : "No active workout in backup."}
            <br />
            {data.activeWorkout ? "Your current workout will be replaced." : ""}
          </span>
        </Confirm>
      )}
      {clear && (
        <Modal
          title="Clear personal data on this device?"
          close={() => C(false)}
        >
          <p>
            Workouts, custom plans, body weight entries, and the current workout
            will be removed. Built-in exercises and templates will stay.
          </p>
          <label>
            Type DELETE to confirm. This cannot be undone.
            <input value={text} onChange={(e) => T(e.target.value)} />
          </label>
          <div className="modal-actions">
            <Button onClick={() => C(false)}>Cancel</Button>
            <Button
              kind="danger"
              disabled={text !== "DELETE"}
              onClick={async () => {
                if (await save(clearPersonal, "Personal data cleared."))
                  C(false);
              }}
            >
              Clear personal data
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
const nav = [
  { path: "/", name: "Dashboard", Icon: LayoutDashboard },
  { path: "/workouts", name: "Workouts", Icon: Dumbbell },
  { path: "/plans", name: "Plans", Icon: CalendarDays },
  { path: "/exercises", name: "Exercises", Icon: BookOpen },
  { path: "/progress", name: "Progress", Icon: ChartNoAxesCombined },
  { path: "/settings", name: "Settings", Icon: SettingsIcon },
];
function App() {
  const [, render] = useState(0),
    [ready, R] = useState(false),
    [busy, B] = useState(false),
    [notice, N] = useState(""),
    [error, E] = useState(""),
    [menu, M] = useState(false),
    [discard, D] = useState<string | null>(null);
  const navigate = useNavigate(),
    location = useLocation();
  const dirty = useRef(false),
    queue = useRef<Promise<unknown>>(Promise.resolve()),
    pendingWrites = useRef(0),
    pendingCommands = useRef(0);
  const blocker = useBlocker(() => dirty.current);
  useEffect(() => {
    const un = repo.subscribe(() => render((n) => n + 1));
    const stop = repo.watch();
    void repo.load().finally(() => R(true));
    return () => {
      un();
      stop();
    };
  }, []);
  useEffect(() => {
    const f = (e: BeforeUnloadEvent) => {
      if (dirty.current || pendingWrites.current > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, []);
  useEffect(() => {
    document.title = `${nav.find((n) => (n.path === "/" ? location.pathname === "/" : location.pathname.startsWith(n.path)))?.name ?? "FORMA"} · FORMA`;
    document.querySelector<HTMLElement>("h1")?.focus();
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const go = (path: string) => {
    const perform = () => {
      if (dirty.current) {
        D(path);
        return;
      }
      M(false);
      navigate(path);
    };
    if (pendingWrites.current > 0) {
      void queue.current.then(perform);
    } else perform();
  };
  const save = (
    fn: (d: Data) => void,
    message?: string,
    quiet = false,
  ): Promise<boolean> => {
    pendingWrites.current++;
    if (!quiet) {
      pendingCommands.current++;
      B(true);
    }
    N("");
    E("");
    const result = queue.current.then(async () => {
      try {
        await repo.commit(fn);
        E("");
        if (message) N(message);
        return true;
      } catch (err) {
        E((err as Error).message);
        return false;
      } finally {
        pendingWrites.current--;
        if (!quiet) {
          pendingCommands.current--;
          B(pendingCommands.current > 0);
        }
      }
    });
    queue.current = result;
    return result;
  };
  if (!ready)
    return (
      <main className="loading" aria-busy="true">
        Loading your workspace…
      </main>
    );
  if (!repo.data)
    return (
      <main className="recovery">
        <div className="brand">
          <Activity />
          FORMA
        </div>
        <h1>Let's recover your workspace.</h1>
        <p role="alert">{repo.error}</p>
        <div className="actions">
          <button tabIndex={0} onClick={() => repo.load()}>
            Try again
          </button>
          <button
            tabIndex={0}
            onClick={() => {
              try {
                const raw = repo.raw();
                if (raw) download(raw, "forma-recovery.json");
                else E("The saved data could not be read.");
              } catch {
                E("The saved data could not be read.");
              }
            }}
          >
            Download raw backup
          </button>
          <button tabIndex={0} onClick={() => D("reset")}>
            Reset local storage
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
        {discard && (
          <Modal title="Reset saved data?" close={() => D(null)}>
            <p>
              Download your raw backup first. Type DELETE to replace the
              unreadable local data with an empty workspace.
            </p>
            <RecoveryReset close={() => D(null)} />
          </Modal>
        )}
      </main>
    );
  const ctx = { data: repo.data, save, go, dirty, busy, error };
  return (
    <Context.Provider value={ctx}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="mobile-header">
        <div className="brand">
          <Activity />
          FORMA
        </div>
        <button
          tabIndex={0}
          aria-label="Open navigation"
          title="Open navigation"
          aria-expanded={menu}
          onClick={() => M(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </div>
      <aside className="sidebar">
        <div className="brand">
          <Activity size={31} strokeWidth={2.5} />
          FORMA
          <span className="brand-dot" />
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Main navigation">
          {nav.map(({ path, name, Icon }) => (
            <NavLink
              key={path}
              end={path === "/"}
              to={path}
              onClick={(e) => {
                e.preventDefault();
                go(path);
              }}
            >
              <Icon size={20} />
              {name}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="mini-line" />
          <p>
            Build strength.
            <br />
            Find your form.
          </p>
        </div>
        <div className="local-workspace">
          <span className="local-icon">
            <ShieldCheck size={19} />
          </span>
          <div>
            <strong>Local workspace</strong>
            <small>Just you and your progress</small>
          </div>
        </div>
      </aside>
      <main id="main">
        <div className="topline">
          <span>PERSONAL TRAINING JOURNAL</span>
          <span>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div aria-live="polite" className={notice ? "success" : "sr-only"}>
          {notice}
          {notice && (
            <button
              tabIndex={0}
              className="icon-button"
              aria-label="Dismiss notification"
              title="Dismiss notification"
              onClick={() => N("")}
            >
              <X size={16} />
            </button>
          )}
        </div>
        {error && (
          <div role="alert" className="error-banner">
            {error}
            <button tabIndex={0} onClick={() => E("")}>
              Dismiss
            </button>
          </div>
        )}
        {repo.conflict && (
          <div role="alert" className="error-banner">
            Data changed in another tab. Reload to continue.
            <button tabIndex={0} onClick={() => window.location.reload()}>
              Reload
            </button>
            <button
              tabIndex={0}
              onClick={() =>
                download(repo.exportBackup(), "forma-stale-backup.json")
              }
            >
              Export recoverable data
            </button>
          </div>
        )}
        <fieldset
          className="app-fieldset"
          disabled={repo.conflict || busy}
          aria-busy={busy}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/workouts/active" element={<Recorder />} />
            <Route path="/workouts/:id" element={<WorkoutDetail />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/plans/new" element={<PlanEditor key="new" />} />
            <Route
              path="/plans/:id/edit"
              element={<PlanEditor key={location.pathname} />}
            />
            <Route path="/plans/:id" element={<PlanDetail />} />
            <Route
              path="/exercises"
              element={
                <>
                  <Header
                    title="Exercises"
                    sub="Know the movement. Find your form."
                  />
                  <ExerciseBrowser />
                </>
              }
            />
            <Route path="/exercises/:id" element={<ExerciseDetail />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </fieldset>
      </main>
      {menu && (
        <Modal title="Navigation" close={() => M(false)}>
          <nav className="mobile-nav">
            {nav.map(({ path, name, Icon }) => (
              <button tabIndex={0} key={path} onClick={() => go(path)}>
                <Icon size={20} />
                {name}
              </button>
            ))}
          </nav>
        </Modal>
      )}
      {blocker.state === "blocked" && (
        <Confirm
          title="Discard changes?"
          action="Discard changes"
          close={() => blocker.reset()}
          onConfirm={() => {
            dirty.current = false;
            blocker.proceed();
          }}
        >
          Unsaved changes will be lost. Stay here to finish editing, or discard
          your changes.
        </Confirm>
      )}
      {discard && (
        <Confirm
          title="Discard changes?"
          action="Discard changes"
          close={() => D(null)}
          onConfirm={() => {
            dirty.current = false;
            D(null);
            M(false);
            navigate(discard);
          }}
        >
          Unsaved changes will be lost. Stay here to finish editing, or discard
          your changes.
        </Confirm>
      )}
    </Context.Provider>
  );
}
function RecoveryReset({ close }: { close: () => void }) {
  const [text, T] = useState(""),
    [error, E] = useState("");
  return (
    <>
      <label>
        Type DELETE
        <input value={text} onChange={(e) => T(e.target.value)} />
      </label>
      <div className="modal-actions">
        <button tabIndex={0} onClick={close}>
          Cancel
        </button>
        <button
          tabIndex={0}
          className="danger"
          disabled={text !== "DELETE"}
          onClick={async () => {
            try {
              await repo.resetCorrupt();
              window.location.reload();
            } catch (error) {
              E(
                error instanceof Error
                  ? error.message
                  : "Unable to reset local data. Try another browser.",
              );
            }
          }}
        >
          Reset data
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="recovery">
        <h1>Something went wrong.</h1>
        <p>Your saved data has not been reset. Reload to try again.</p>
        <button tabIndex={0} onClick={() => window.location.reload()}>
          Reload
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <RouterProvider
      router={createBrowserRouter([{ path: "*", element: <App /> }], {
        basename: import.meta.env.BASE_URL,
      })}
    />
  </ErrorBoundary>,
);
