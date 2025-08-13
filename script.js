document.addEventListener("DOMContentLoaded", () => {
  // ========= CONFIG =========
  // Cole aqui o URL do seu Apps Script implantado como Web App
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbynONu43266_FLWzHm7f0j5zcd7lov6k_D0nJM1oQdXakuA2I-yjfjuNJM1N5mdwabeqA/exec";

  const TURMAS_POR_SERIE = {
    "8º ano": ["A", "B"],
    "9º ano": ["A", "B", "C"],
    "1ª série": ["A", "B", "C"],
    "2ª série": ["A", "B"],
    "3ª série": ["A", "B"]
  };

  const NIVEL_POR_SERIE = (serie) =>
    (serie === "8º ano" || serie === "9º ano") ? "Fundamental" : "Médio";

  const CURSOS_FUNDAMENTAL = [
    "Saúde, bem - estar e qualidade de vida - Profª Rayllene.",
    "Poéticas da música: violão e expressão - Profº Tiago",
    "Jogos matemáticos do fundamental: Aprendendo brincando - ProfºDeiwson",
    "Tecnologia e comunicação: Tecnologia Criativa e cidadania digital - Profº André",
    "Dinâmica total: do brincar ao conhecimento - Profª Alessandra"
  ];

  const CURSOS_MEDIO = [
    "Redação ENEM: fábrica de textos - Profº Fred",
    "Narrativas, lendas e mitos indígenas - Profº Wander",
    "Autores do encanto: Criando mundos com palavras - Profª Kênia",
    "Projeto me vejo, te vejo: Construindo caminhos - Profº Luciano",
    "A voz das garotas - Profª  Mayara",
    "Construindo com a geometria: Explorando forças, medidas e espaço - Profº Fillipe",
    "Urbanidade: desafios e oportunidades da cidade - Profº Willian"
  ];

  const CAPACIDADE = { Fundamental: 41, "Médio": 30 };

  // ========= ELEMENTOS =========
  const form = document.getElementById("form-inscricao");
  const nomeEl = document.getElementById("nome");
  const serieEl = document.getElementById("serie");
  const turmaEl = document.getElementById("turma");
  const turmaLabel = document.getElementById("turma-label");

  const op1El = document.getElementById("op1");
  const op2El = document.getElementById("op2");
  const op3El = document.getElementById("op3");
  const selectsOp = [op1El, op2El, op3El];

  const msg = document.getElementById("mensagem");
  const btn = document.getElementById("btn-enviar");
  const limitesHint = document.getElementById("limites-hint");

  // ========= HELPERS =========
  const setMsg = (texto, ok = false) => {
    msg.textContent = texto;
    msg.className = ok ? "msg-ok" : "msg-erro";
  };
  const limparSelect = (s, placeholder = "Selecione") => {
    s.innerHTML = `<option value="">${placeholder}</option>`;
  };
  const cursosPorNivel = (nivel) => nivel === "Fundamental" ? CURSOS_FUNDAMENTAL : CURSOS_MEDIO;
  const dedupeCursos = () => {
    const vals = selectsOp.map(s => s.value).filter(Boolean);
    return new Set(vals).size === vals.length;
  };
  const formatRotulo = (curso, rest, cap) =>
    rest > 0 ? `${curso} (${rest}/${cap} vagas restantes)` : `${curso} (ESGOTADO)`;

  function preencherTurmas(serie) {
    const turmas = TURMAS_POR_SERIE[serie] || [];
    if (turmas.length) {
      turmaLabel.style.display = "block";
      turmaEl.style.display = "block";
      turmaEl.required = true;
      limparSelect(turmaEl, "Selecione a turma");
      turmas.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t; opt.textContent = t;
        turmaEl.appendChild(opt);
      });
    } else {
      turmaLabel.style.display = "none";
      turmaEl.style.display = "none";
      turmaEl.required = false;
      limparSelect(turmaEl, "Selecione a turma");
    }
  }

  // ========= CARGA DE CURSOS =========
  async function carregarCursosDoNivel(nivel) {
    selectsOp.forEach(s => { limparSelect(s, "Carregando..."); s.disabled = true; });
    try {
      const res = await fetch(`${SCRIPT_URL}?action=contagem&nivel=${encodeURIComponent(nivel)}`);
      if (!res.ok) throw new Error("Falha ao buscar contagens");
      const dados = await res.json(); // { [curso]: { inscritos, vagas, restantes } }

      const cap = CAPACIDADE[nivel];
      const lista = cursosPorNivel(nivel);

      selectsOp.forEach(select => {
        limparSelect(select, "Selecione");
        lista.forEach(curso => {
          const info = dados[curso] || { inscritos: 0, vagas: cap, restantes: cap };
          if (info.restantes > 0) {
            const opt = document.createElement("option");
            opt.value = curso;
            opt.textContent = formatRotulo(curso, info.restantes, cap);
            select.appendChild(opt);
          }
        });
        select.disabled = false;
      });

      limitesHint.textContent =
        nivel === "Fundamental"
          ? "Limite por curso no Fundamental: 41 estudantes."
          : "Limite por curso no Médio: 30 estudantes.";
    } catch (e) {
      console.error(e);
      setMsg("Erro ao carregar cursos. Tente novamente mais tarde.");
      selectsOp.forEach(s => { limparSelect(s, "Indisponível"); s.disabled = true; });
    }
  }

  // ========= EVENTOS =========
  serieEl.addEventListener("change", () => {
    const serie = serieEl.value;
    preencherTurmas(serie);
    if (serie) {
      const nivel = NIVEL_POR_SERIE(serie);
      carregarCursosDoNivel(nivel);
    } else {
      selectsOp.forEach(s => { limparSelect(s); s.disabled = true; });
      limitesHint.textContent = "Os cursos disponíveis e vagas variam conforme a série selecionada.";
    }
  });

  selectsOp.forEach(s => {
    s.addEventListener("change", () => {
      if (!dedupeCursos()) setMsg("As três opções precisam ser diferentes.");
      else setMsg("");
    });
  });

  // ========= SUBMISSÃO =========
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(""); btn.disabled = true;

    const nome = nomeEl.value.trim();
    const serie = serieEl.value;
    const turma = turmaEl.value;
    const op1 = op1El.value;
    const op2 = op2El.value;
    const op3 = op3El.value;

    if (!nome || !serie || !turma || !op1 || !op2 || !op3) {
      setMsg("Preencha todos os campos obrigatórios."); btn.disabled = false; return;
    }
    if (!dedupeCursos()) {
      setMsg("As três opções precisam ser diferentes."); btn.disabled = false; return;
    }

    const nivel = NIVEL_POR_SERIE(serie);

    try {
      // Checagem rápida de duplicidade no front (opcional)
      const existsRes = await fetch(`${SCRIPT_URL}?action=existeNome&nome=${encodeURIComponent(nome)}`);
      if (existsRes.ok) {
        const exists = await existsRes.json();
        if (exists && exists.exists) {
          setMsg("Este nome já possui inscrição registrada. Procure a coordenação para ajustes.");
          btn.disabled = false; return;
        }
      }

      const payload = { nome, serie, turma, op1, op2, op3 };
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // evita preflight/CORS
        body: JSON.stringify(payload)
      });

      // Mesmo com text/plain, a resposta vem em JSON do Apps Script:
      const text = await res.text();
      let resposta;
      try { resposta = JSON.parse(text); } catch { resposta = { status: "erro", mensagem: text }; }

      if (resposta.status === "duplicado") {
        setMsg("Este nome já possui inscrição registrada. Procure a coordenação para ajustes.");
      } else if (resposta.status === "esgotado") {
        setMsg("Nenhuma das 3 opções tem vaga no momento. Por favor, escolha outras opções.");
        await carregarCursosDoNivel(nivel);
      } else if (resposta.status === "ok") {
        setMsg(`Inscrição confirmada! Seu curso sorteado foi: ${resposta.cursoSorteado}.`, true);
        form.reset();
        turmaLabel.style.display = "none";
        turmaEl.style.display = "none";
        selectsOp.forEach(s => { limparSelect(s); s.disabled = true; });
      } else {
        setMsg(resposta.mensagem || "Ocorreu um erro. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      setMsg("Falha ao enviar inscrição. Verifique sua conexão e tente novamente.");
    } finally {
      btn.disabled = false;
    }
  });

  // Estado inicial
  turmaLabel.style.display = "none";
  turmaEl.style.display = "none";
  selectsOp.forEach(s => { limparSelect(s); s.disabled = true; });
});
