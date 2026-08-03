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

    const now = new Date();
    const fullFormatter = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const shortFormatter = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const fullTimestamp = fullFormatter.format(now) + ' (orario di San Paolo, Brasile)';
    const shortTimestamp = shortFormatter.format(now).replace(',', '');

    const cardTitle = nome + ' — ' + shortTimestamp;
    const desc = 'Nome: ' + nome + '\nEmail: ' + email + '\nTelefono: ' + telefono + '\nRichiesta inviata: ' + fullTimestamp;

    const trelloParams = new URLSearchParams({
      key: env.TRELLO_KEY,
      token: env.TRELLO_TOKEN,
      idList: env.TRELLO_LIST_ID,
      name: cardTitle,
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
