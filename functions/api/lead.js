export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const data = await request.json();
    const nome = (data.nome || '').toString().trim();
    const email = (data.email || '').toString().trim();
    const telefono = (data.telefono || '').toString().trim();

    if (!nome || !email || !telefono) {
      return new Response(JSON.stringify({ error: 'Campi mancanti' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const desc = 'Nome: ' + nome + '\nEmail: ' + email + '\nTelefono: ' + telefono;

    const trelloParams = new URLSearchParams({
      key: env.TRELLO_KEY,
      token: env.TRELLO_TOKEN,
      idList: env.TRELLO_LIST_ID,
      name: nome,
      desc: desc
    });
    const trelloResp = await fetch('https://api.trello.com/1/cards?' + trelloParams.toString(), {
      method: 'POST'
    });
    const trelloOk = trelloResp.ok;

    let emailOk = true;
    if (env.FORMSPREE_ENDPOINT) {
      const emailResp = await fetch(env.FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          telefono,
          _subject: 'Nuovo lead dal sito: ' + nome
        })
      });
      emailOk = emailResp.ok;
    }

    return new Response(JSON.stringify({ ok: true, trelloOk, emailOk }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
