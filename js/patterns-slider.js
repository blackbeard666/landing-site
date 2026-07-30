/* ============================================================
   patterns-slider.js — the hero's "patterns i've broken" panel.
   Vanilla, no dependencies. Loaded with `defer`, so the DOM is parsed
   by the time the bottom of this file runs.

   Each entry shows a TAINT PATH, not a lone snippet: where
   attacker-controlled data enters (source), the hops it takes (flow),
   and where it lands somewhere dangerous (sink). A single
   out-of-context block never explained WHY the code was a bug.

   EVERY FRAGMENT MUST BE REAL.
   Code is copied from the `## Root Cause Analysis` section of the
   matching write-up in carlo-notes/content/cves/. Annotation comments
   are editorial; the code around them is verbatim. Where lines had to
   be skipped to keep a fragment short, that is marked with an explicit
   `dim` elision comment — never silently stitch two non-adjacent lines
   together to make a tidier snippet. The panel is checkable, and
   invented code is worse than no panel.

   Data contract per entry:
     cve        optional. Omit for a non-CVE writeup; the severity chip
                removes itself and `provenance` carries the origin.
     severity   'HIGH' | 'MEDIUM' | 'LOW'
     target     short product name
     provenance 'disclosure' | 'hackstreetboys' | 'research' | 'ctf'
                (named `provenance`, not `source`, because `source` now
                means the taint source)
     title      the pattern, not the CVE title
     impact     one sentence, concrete
     slug       path under path2pwn — see BASE below
     flow       the hops between source and sink, one short line
     source     { file, bug, lines }  where untrusted data enters
     sink       { file, bug, lines }  where it becomes dangerous

   `bug` is a 0-based index into that fragment's `lines`, or an array of
   them — use an array to band an annotation comment with the line it
   describes. `lines` is [ [ [text, tok?], ... ], ... ] where tok is
   g3 identifier | g4 string | r4 bug comment | dim elision/context.

   KEEP ANNOTATED LINES UNDER ~58 CHARACTERS. The panel is ~500px wide
   and <pre> scrolls horizontally, so a long line pushes its own comment
   out of view — losing the one thing the reader needed. Let unannotated
   code scroll; if the annotated line won't fit, put the comment on its
   own line above and band both with `bug: [n, n+1]`.

   TWO MORE SHAPE RULES, both so the panel's height stays constant as it
   advances (all measured — see CLAUDE.md):
     * every entry has exactly 2 source lines and 3 sink lines
     * `flow` must be <= ~54 characters so it wraps to at most 2 lines
   Break either and the panel will jump as it advances.
   `scratchpad/panel-parts.js` attributes the variance per element.
   ============================================================ */

/* The landing page is on carlojaeavila.dev but the write-ups live on
   path2pwn.carlojaeavila.dev, so these have to be absolute. A relative
   '/cves/…' would 404 here. */
const BASE = 'https://path2pwn.carlojaeavila.dev';

const PATTERNS = [
  {
    cve: 'CVE-2024-44336',
    severity: 'MEDIUM',
    target: 'AnkiDroid',
    provenance: 'disclosure',
    title: 'An implicit intent trusts whoever answers it',
    impact: 'A malicious app answers the image picker with a file:// URI into AnkiDroid’s own private storage, and AnkiDroid copies it somewhere world-readable.',
    slug: '/cves/cve-2024-44336/',
    flow: 'getImageUri → handleSelectImageIntent → internalizeUri',
    source: {
      file: 'BasicImageFieldController.kt',
      bug: 1,
      lines: [
        [['private fun', 'g3'], [' getImageUri(context: Context, data: Intent): Uri? {']],
        [['    val', 'g3'], [' uri = data.data'], ['   // no scheme or origin check', 'r4']]
      ]
    },
    sink: {
      /* All three lines banded, not [0, 2]: skipping the `try {` in the middle
         split the tint into two separate bands, which read as two unrelated
         bugs instead of one contiguous problem. Band the whole region. */
      file: 'FileUtil.kt',
      bug: [0, 1, 2],
      lines: [
        [['// into a cache dir any app can read', 'r4']],
        [['try', 'g3'], [' {']],
        [['    CompatHelper.compat.copyFile(inputStream, internalFile.absolutePath)']]
      ]
    }
  },
  {
    cve: 'CVE-2024-33469',
    severity: 'HIGH',
    target: 'Amaze File Manager',
    provenance: 'disclosure',
    title: 'A path extra reaches the shell unescaped',
    impact: 'With root explorer enabled, any installed app can inject arbitrary commands through the path it hands to DatabaseViewerActivity.',
    slug: '/cves/cve-2024-33469/',
    flow: 'load() → CopyFilesCommand.copyFiles() → mountPath()',
    source: {
      file: 'DatabaseViewerActivity.java',
      bug: 0,
      lines: [
        [['path = getIntent().getStringExtra('], ['"path"', 'g4'], [');'], ['  // untrusted', 'r4']],
        [['// …only null-checked…', 'dim']]
      ]
    },
    sink: {
      file: 'MountPathCommand.kt',
      bug: 1,
      lines: [
        [['READ_ONLY -> {']],
        [['    val', 'g3'], [' command = '], ['"umount -r \\"$path\\""', 'g4'], ['   // unescaped', 'r4']],
        [['    runShellCommand(command)']]
      ]
    }
  },
  {
    cve: 'CVE-2023-4876',
    severity: 'HIGH',
    target: 'Inure App Manager',
    provenance: 'disclosure',
    title: 'A FileProvider that serves the whole filesystem',
    impact: 'Inure’s own provider will address any path on the device, so an exported activity can be pointed at Inure’s private data directory.',
    slug: '/cves/cve-2023-4876/',
    flow: '<root-path path="."/> → getTTFFile → external storage',
    source: {
      /* Annotation sits on the short call line and bands both, because the
         tainted argument line is 48 characters of real code before any comment
         could start — it would have pushed its own annotation out of view. */
      file: 'TTFViewerActivity.kt',
      bug: [0, 1],
      lines: [
        [['val', 'g3'], [' typeFace = TTFHelper.getTTFFile('], ['   // unvalidated', 'r4']],
        [['    contentResolver.openInputStream(intent.data!!)!!,']]
      ]
    },
    sink: {
      file: 'TTFHelper.kt',
      bug: 1,
      lines: [
        [['val', 'g3'], [' file = '], ['File', 'g3'], ['(context.getExternalFilesDir('], ['null', 'g3'], [')?.path + '], ['"/font_cache/"', 'g4'], [' + name)']],
        [['copyStreamToFile(inputStream, file)'], ['  // to shared storage', 'r4']],
        [['return', 'g3'], [' Typeface.createFromFile(file)']]
      ]
    }
  },
  {
    cve: 'CVE-2023-4435',
    severity: 'MEDIUM',
    target: 'Inure App Manager',
    provenance: 'disclosure',
    title: 'An exported activity runs the script you hand it',
    impact: 'A shell script dropped on /sdcard is copied into Inure’s cache and executed under Inure’s UID, giving it that app’s private data.',
    slug: '/cves/cve-2023-4435/',
    flow: 'openInputStream → copy to cacheDir → RunScript',
    source: {
      file: 'BashAssociation.kt',
      bug: 0,
      lines: [
        [['intent.data?.'], ['let', 'g3'], [' {'], ['   // unvalidated — any file:// URI', 'r4']],
        [['    contentResolver.openInputStream(it)?.'], ['use', 'g3'], [' { inputStream ->']]
      ]
    },
    sink: {
      file: 'BashAssociation.kt',
      bug: 2,
      lines: [
        [['intent.action = RunScript.ACTION_RUN_SCRIPT']],
        [['intent.putExtra(RunScript.EXTRA_SCRIPT_PATH, file.absolutePath)']],
        [['startActivity(intent)'], ['   // runs it as Inure', 'r4']]
      ]
    }
  },
  {
    cve: 'CVE-2023-4434',
    severity: 'MEDIUM',
    target: 'Inure App Manager',
    provenance: 'disclosure',
    title: 'Reading a caller-supplied URI with the app’s own privileges',
    impact: 'An exported text viewer opens whatever file:// URI it is given, using Inure’s filesystem access rather than the caller’s.',
    slug: '/cves/cve-2023-4434/',
    flow: 'exported VIEW text/* → Text fragment → intent.data',
    source: {
      /* No annotation: the flaw is at the sink, and the "exported VIEW text/*"
         context lives in `flow`. Annotating this line pushed the comment past
         the panel edge for no gain. A source fragment does not have to carry a
         marker — only the line that actually holds the bug does. */
      file: 'TextViewerActivity.kt',
      bug: [],
      lines: [
        [['supportFragmentManager.beginTransaction()']],
        [['    .replace(R.id.app_container, Text.newInstance())']]
      ]
    },
    sink: {
      file: 'Text.kt',
      bug: [1, 2],
      lines: [
        [['val', 'g3'], [' string = requireActivity().contentResolver']],
        [['    // intent.data used with no scheme or path check', 'r4']],
        [['    .openInputStream(requireActivity().intent.data!!)!!']]
      ]
    }
  },
  {
    cve: 'CVE-2023-5948',
    severity: 'MEDIUM',
    target: 'Amaze File Utilities',
    provenance: 'disclosure',
    title: 'A library hands the caller’s own intent back, grant included',
    impact: 'The attacker launches the welcome screen carrying a URI grant, presses back, and setResult returns that grant — now live against a non-exported provider.',
    slug: '/cves/cve-2023-5948/',
    flow: 'WelcomeScreen → WelcomePermissionScreen → onBackPressed',
    source: {
      file: 'WelcomeScreen.kt',
      bug: 1,
      lines: [
        [['class', 'g3'], [' WelcomeScreen : WelcomePermissionScreen() { ... }']],
        [['// neither layer overrides onBackPressed()', 'dim']]
      ]
    },
    sink: {
      file: 'WelcomeActivity.java',
      bug: 1,
      lines: [
        [['public void', 'g3'], [' onBackPressed() {']],
        [['    setResult(RESULT_CANCELED, getIntent());'], ['  // echoed back', 'r4']],
        [['    finish();']]
      ]
    }
  }
];

const CLS = { g3: 'tok-id', g4: 'tok-str', r4: 'tok-bug', dim: 'tok-dim' };

/* 15s, and it is NOT an arbitrary round number — don't "tidy" it back down.

   Each slide carries ~36 words of prose (title + flow + impact) plus 5 lines of
   code across two fragments. At 200wpm for prose and ~1.2s per line for code
   that is ~16.6s to actually comprehend, not skim. The handoff's 4600ms — which
   survived until the panel became a source/sink pair and got much denser —
   covered 28% of that, so the panel moved on before the sink had been read.

   Deliberately still a loop: it resumes after hover release even if the reader
   navigated manually. Stopping permanently on first interaction was considered
   and declined. */
const INTERVAL = 15000;

/* Renders one fragment (a source or a sink), not a whole pattern.

   The lines are joined with '' and NOT '\n'. Each .line is display:block so it
   already breaks; inside a <pre> a literal newline between them is preserved as
   extra whitespace, which rendered as thin untinted stripes between consecutive
   banded lines. Copying still yields one line per row, because innerText
   inserts breaks for block-level elements. */
function renderCode(fragment) {
  const bug = Array.isArray(fragment.bug) ? fragment.bug : [fragment.bug];
  return fragment.lines.map((segs, i) => {
    const inner = segs
      .map(([text, tok]) => {
        const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return tok ? `<span class="${CLS[tok]}">${safe}</span>` : safe;
      })
      .join('');
    return `<span class="line${bug.includes(i) ? ' is-bug' : ''}">${inner}</span>`;
  }).join('');
}

function initSlider(root) {
  const el = (sel) => root.querySelector(sel);
  const dots = el('[data-dots]');
  let i = 0;
  let timer = null;

  /* Two independent reasons to hold the timer. The handoff version kept a
     single `paused` flag for both, so a mouseleave would restart the loop
     while the panel was still scrolled off screen. */
  let interacting = false;
  let visible = true;

  dots.innerHTML = PATTERNS.map((_, n) =>
    `<button type="button" class="dot" data-i="${n}" aria-label="Pattern ${n + 1} of ${PATTERNS.length}"></button>`
  ).join('');

  function draw() {
    const p = PATTERNS[i];
    el('[data-badge]').textContent = p.cve || p.provenance;
    el('[data-target]').textContent = p.target;
    el('[data-provenance]').textContent = p.provenance;
    el('[data-title]').textContent = p.title;
    el('[data-impact]').textContent = p.impact;
    el('[data-link]').href = BASE + p.slug;
    el('[data-count]').textContent = `${i + 1} / ${PATTERNS.length}`;

    el('[data-source-file]').textContent = p.source.file;
    el('[data-source-code]').innerHTML = renderCode(p.source);
    el('[data-sink-file]').textContent = p.sink.file;
    el('[data-sink-code]').innerHTML = renderCode(p.sink);
    el('[data-flow]').textContent = p.flow;

    const sev = el('[data-sev]');
    sev.hidden = !p.severity;
    if (p.severity) {
      sev.textContent = p.severity;
      const s = p.severity.toLowerCase();
      sev.className = 'badge-sev is-' +
        (['critical', 'high', 'low'].indexOf(s) >= 0 ? s : 'medium');
    }

    dots.querySelectorAll('.dot').forEach((d, n) => {
      d.classList.toggle('is-on', n === i);
      d.setAttribute('aria-current', n === i ? 'true' : 'false');
    });
  }

  const go = (n) => { i = (n + PATTERNS.length) % PATTERNS.length; draw(); };

  dots.addEventListener('click', (e) => {
    const d = e.target.closest('.dot');
    if (d) go(Number(d.dataset.i));
  });
  el('[data-prev]').addEventListener('click', () => go(i - 1));
  el('[data-next]').addEventListener('click', () => go(i + 1));

  root.addEventListener('mouseenter', () => { interacting = true; });
  root.addEventListener('mouseleave', () => { interacting = false; });
  root.addEventListener('focusin', () => { interacting = true; });
  root.addEventListener('focusout', () => { interacting = false; });

  root.tabIndex = 0;
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', "Vulnerable patterns I've broken");
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { go(i - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { go(i + 1); e.preventDefault(); }
  });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function sync() {
    const shouldRun = !reduced.matches && visible && !interacting;
    if (shouldRun && timer === null) {
      timer = setInterval(() => go(i + 1), INTERVAL);
    } else if (!shouldRun && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  /* Defaults to visible so that if the callback never fires the panel keeps
     advancing, rather than sitting frozen. */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); })
      .observe(root);
  }
  ['mouseenter', 'mouseleave', 'focusin', 'focusout'].forEach((ev) =>
    root.addEventListener(ev, sync)
  );
  reduced.addEventListener('change', sync);

  draw();
  sync();
}

document.querySelectorAll('[data-slider]').forEach(initSlider);
