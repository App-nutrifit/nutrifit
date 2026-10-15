// NutriFit · funciones compartidas de la web de pruebas (pruebas.html y resultados.html).
// Usa la misma cuenta de NutriFit (Supabase Auth). La clave "anon" es pública (es la misma de la app);
// la seguridad la dan las reglas de la base: cada tester solo ve y edita su propia fila.
var NF = (function () {
  var URL = 'https://liquboxfszhoybhutacp.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcXVib3hmc3pob3liaHV0YWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzA2MDMsImV4cCI6MjA5MDk0NjYwM30.PW-xYDfYaRFK1ArRf7BiFQLOv-vHKdz6P3ZEZkjLRt0';
  var STORE = 'nf_pruebas_sesion';
  var session = null;

  function load() { try { session = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { session = null; } return session; }
  function save(s) { session = s; try { s ? localStorage.setItem(STORE, JSON.stringify(s)) : localStorage.removeItem(STORE); } catch (e) {} }

  function authFetch(path, body) {
    return fetch(URL + '/auth/v1/' + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify(body)
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); });
  }
  function keep(j) {
    return { access_token: j.access_token, refresh_token: j.refresh_token,
             expires_at: Date.now() + (Number(j.expires_in) || 3600) * 1000, user: { id: j.user.id, email: j.user.email } };
  }

  function login(email, password) {
    return authFetch('token?grant_type=password', { email: email, password: password }).then(function (res) {
      if (!res.ok) {
        var msg = (res.j.error_description || res.j.msg || res.j.message || '').toLowerCase();
        if (msg.indexOf('invalid') >= 0) throw new Error('Correo o contraseña incorrectos. Usa los mismos datos con los que entras a la app.');
        if (msg.indexOf('confirm') >= 0) throw new Error('Tu correo no está confirmado. Revisa tu bandeja de entrada.');
        throw new Error('No se pudo entrar. Revisa tu internet e intenta de nuevo.');
      }
      save(keep(res.j)); return session;
    });
  }
  function logout() { save(null); }

  // Devuelve un token válido (lo renueva si está por vencer)
  function token() {
    load();
    if (!session) return Promise.reject(new Error('sin sesion'));
    if (Date.now() < session.expires_at - 60000) return Promise.resolve(session.access_token);
    return authFetch('token?grant_type=refresh_token', { refresh_token: session.refresh_token }).then(function (res) {
      if (!res.ok) { save(null); throw new Error('sin sesion'); }
      save(keep(res.j)); return session.access_token;
    });
  }

  function rest(method, path, body, prefer) {
    return token().then(function (t) {
      var h = { apikey: KEY, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' };
      if (prefer) h.Prefer = prefer;
      return fetch(URL + '/rest/v1/' + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined });
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (x) { throw new Error('Error ' + r.status + ': ' + x.slice(0, 200)); });
      return r.text().then(function (x) { return x ? JSON.parse(x) : null; });
    });
  }

  function resetPassword(email) {
    var back = location.href.replace(/[^/]*$/, '') + 'restablecer.html';
    return authFetch('recover?redirect_to=' + encodeURIComponent(back), { email: email });
  }

  return {
    load: load, login: login, logout: logout, rest: rest, resetPassword: resetPassword,
    user: function () { return load() && session.user; },
    DATA: {
 "sections": [
  {
   "code": "A",
   "title": "Registro y acceso",
   "intro": "Haz A1 y A2 con una cuenta nueva (puede ser la misma cuenta de prueba que usarás en A4 y J1).",
   "tests": [
    {
     "id": "A1",
     "t": "Crear cuenta: paso 1",
     "steps": "Escribe correo y contraseña. Prueba primero \"abc\" y luego algo como \"Nutri-Fit2026\". Pon una fecha de nacimiento de menor de 18 y luego la real. Toca los enlaces de Términos y Privacidad.",
     "expect": "La barra cambia de roja a verde; con menos de 18 años no deja seguir; los enlaces abren las páginas; sin marcar la casilla de aceptar no deja seguir."
    },
    {
     "id": "A2",
     "t": "Crear cuenta: pasos 2 a 5",
     "steps": "Peso y estatura (prueba con coma decimal, ej. 72,5), objetivo, actividad, restricciones (prueba \"Otra\" y escribe algo). Revisa el resumen final.",
     "expect": "Acepta coma o punto; el resumen muestra metas e IMC con sentido; al terminar entras a Hoy sin errores."
    },
    {
     "id": "A3",
     "t": "Cerrar sesión y volver a entrar",
     "steps": "Perfil → Cerrar sesión. Entra de nuevo con tu correo y contraseña. Prueba también una contraseña equivocada.",
     "expect": "Entra con tus datos intactos; con contraseña mala da un mensaje claro."
    },
    {
     "id": "A4",
     "t": "Olvidé mi contraseña (cuenta de prueba)",
     "steps": "En el inicio de sesión toca \"¿Olvidaste tu contraseña?\". Abre el correo, escribe una contraseña nueva (mira la barra de seguridad). Prueba también repetir la misma contraseña anterior.",
     "expect": "Llega el correo; la página muestra la barra; repetir la anterior da aviso; con la nueva puedes entrar."
    }
   ]
  },
  {
   "code": "B",
   "title": "Registrar comida",
   "intro": "Todo desde la pestaña Agregar (+), eligiendo primero la comida (Desayuno, Comida, Cena o Snack).",
   "tests": [
    {
     "id": "B1",
     "t": "Foto",
     "steps": "Toma foto a un plato real.",
     "expect": "Identifica los alimentos y las porciones tienen sentido; queda en la comida elegida."
    },
    {
     "id": "B2",
     "t": "Corregir una foto",
     "steps": "Después de analizar, escribe una corrección (ej. \"eran 2 tortillas, no 3\") y recalcula.",
     "expect": "El resultado cambia según lo que corregiste."
    },
    {
     "id": "B3",
     "t": "Lista rápida (texto)",
     "steps": "Escribe varios alimentos en una frase, ej. \"2 huevos revueltos, 1 arepa con queso y café negro\".",
     "expect": "Separa cada alimento con cantidades razonables."
    },
    {
     "id": "B4",
     "t": "Voz",
     "steps": "Dicta lo que comiste.",
     "expect": "Entiende lo que dijiste y lo registra."
    },
    {
     "id": "B5",
     "t": "Código de barras",
     "steps": "Escanea un producto empacado.",
     "expect": "Encuentra el producto o avisa claro si no existe."
    },
    {
     "id": "B6",
     "t": "Búsqueda",
     "steps": "Busca un alimento (ej. \"manzana\") y regístralo con tu cantidad.",
     "expect": "Salen opciones y se guarda con los gramos que pusiste."
    },
    {
     "id": "B7",
     "t": "Registro rápido y repetir",
     "steps": "Usa un alimento de \"Registro rápido\" y prueba \"Repetir … de ayer\".",
     "expect": "Se agrega con un toque, sin duplicar."
    },
    {
     "id": "B8",
     "t": "Resumen del día",
     "steps": "En la noche, en lista rápida usa \"¿Qué comiste hoy?\" y cuenta todo tu día en una frase.",
     "expect": "Lo reparte en desayuno, comida, cena y snacks."
    },
    {
     "id": "B9",
     "t": "Fotos de la galería",
     "steps": "Toca \"Fotos de la galería\" y elige 3 fotos de comida de hoy y 1 de ayer. Revisa y toca \"Registrar todo\".",
     "expect": "Cada foto toma la comida y hora en que la tomaste; la de ayer queda en el día de ayer (no en Hoy)."
    }
   ]
  },
  {
   "code": "C",
   "title": "Corregir la comida (nuevo)",
   "intro": "Para C3 necesitas registrar algo en la mañana (antes de las 11) y volver más tarde.",
   "tests": [
    {
     "id": "C1",
     "t": "Mover un alimento",
     "steps": "En Hoy, toca el botón verde de flechas junto a un alimento y elige otra comida.",
     "expect": "El alimento se pasa a la otra comida al instante."
    },
    {
     "id": "C2",
     "t": "Mover todo",
     "steps": "En una comida con 2 o más alimentos, toca \"Mover todo\" y elige otra comida.",
     "expect": "Se pasan todos juntos."
    },
    {
     "id": "C3",
     "t": "Aviso de comida equivocada",
     "steps": "En la mañana registra algo a propósito en \"Comida\". Más tarde, en Agregar, elige \"Comida\".",
     "expect": "Sale un aviso naranja preguntando si va en Desayuno; \"Pasar a Desayuno\" lo mueve y \"Dejar así\" lo oculta."
    },
    {
     "id": "C4",
     "t": "Cambiar al guardar",
     "steps": "Al registrar algo, en el mensaje de felicitación toca \"Cambiar\" junto a \"Guardado en…\".",
     "expect": "Se mueve lo que acabas de registrar y lo siguiente que registres va a la comida nueva."
    }
   ]
  },
  {
   "code": "D",
   "title": "Pantalla Hoy",
   "intro": null,
   "tests": [
    {
     "id": "D1",
     "t": "Editar y borrar",
     "steps": "Toca un alimento: cambia los gramos y guarda. Luego borra otro.",
     "expect": "Los totales del día se actualizan."
    },
    {
     "id": "D2",
     "t": "Agua",
     "steps": "Agrega vasos de agua y prueba deshacer.",
     "expect": "Suma y resta bien."
    },
    {
     "id": "D3",
     "t": "Días anteriores",
     "steps": "Con las flechas de la fecha ve a ayer y regresa.",
     "expect": "Muestra lo de cada día; al volver a la pestaña regresa a hoy."
    },
    {
     "id": "D4",
     "t": "Racha",
     "steps": "Revisa la llama de racha. Si un día no registras nada, revisa al día siguiente.",
     "expect": "Sube un día cuando registras; si pasan 2 días sin registrar vuelve a empezar (hay 1 día de protección)."
    },
    {
     "id": "D5",
     "t": "Encabezado",
     "steps": "Revisa que el título no quede encimado con la hora o la \"isla\" del iPhone en ninguna pestaña.",
     "expect": "Todo se lee completo."
    }
   ]
  },
  {
   "code": "E",
   "title": "Progreso y peso",
   "intro": null,
   "tests": [
    {
     "id": "E1",
     "t": "Gráficas",
     "steps": "Revisa las gráficas de semana y mes.",
     "expect": "No se salen de la tarjeta y los números coinciden con lo registrado."
    },
    {
     "id": "E2",
     "t": "Registrar peso",
     "steps": "Progreso → Peso → + Registrar. Prueba con decimales.",
     "expect": "Se guarda sin error y aparece en la gráfica."
    },
    {
     "id": "E3",
     "t": "Meta de peso y rangos",
     "steps": "Pon una meta de peso y cambia entre 1 mes, 3 meses y Todo.",
     "expect": "La línea de meta y los rangos se ven bien."
    },
    {
     "id": "E4",
     "t": "Compartir",
     "steps": "Toca Compartir y prueba una tarjeta.",
     "expect": "Se genera la imagen con tus datos y abre el menú de compartir."
    }
   ]
  },
  {
   "code": "F",
   "title": "Perfil y preferencias",
   "intro": null,
   "tests": [
    {
     "id": "F1",
     "t": "Idioma",
     "steps": "Perfil → Preferencias → Idioma. Cambia a English, luego Português, luego Automático.",
     "expect": "La lista se cierra al elegir y toda la app cambia de idioma (también las respuestas de la IA)."
    },
    {
     "id": "F2",
     "t": "Unidades",
     "steps": "Cambia a Imperial. Registra un peso en libras y edita tu estatura como 5'9\". Regresa a Métrico.",
     "expect": "Muestra lb y pies/pulgadas; al volver a métrico los valores son los mismos (no cambian solos)."
    },
    {
     "id": "F3",
     "t": "Objetivo, actividad y estatura",
     "steps": "Cambia tu objetivo, tu nivel de actividad y tu estatura.",
     "expect": "Se guardan sin error y las metas diarias se recalculan."
    },
    {
     "id": "F4",
     "t": "Restricciones y foto",
     "steps": "Activa una restricción (ej. sin lactosa) y cambia tu foto de perfil.",
     "expect": "Se guardan; la foto aparece."
    },
    {
     "id": "F5",
     "t": "Recordatorios y bloqueo",
     "steps": "Activa recordatorios y, si quieres, el bloqueo con Face ID / huella.",
     "expect": "Llegan las notificaciones; el bloqueo pide tu cara o huella."
    }
   ]
  },
  {
   "code": "G",
   "title": "Chat y sugerencias",
   "intro": null,
   "tests": [
    {
     "id": "G1",
     "t": "Chat",
     "steps": "Pregunta algo de nutrición (ej. \"¿qué ceno con 500 calorías?\").",
     "expect": "Responde corto, útil y con tus datos del día."
    },
    {
     "id": "G2",
     "t": "Fuera de tema",
     "steps": "Pide algo que no sea de nutrición (ej. \"hazme una tarea de matemáticas\").",
     "expect": "Se niega amablemente."
    },
    {
     "id": "G3",
     "t": "Sugerencias",
     "steps": "Abre Sugerencias.",
     "expect": "Las comidas respetan tus restricciones y lo que te falta del día."
    }
   ]
  },
  {
   "code": "H",
   "title": "Situaciones especiales",
   "intro": null,
   "tests": [
    {
     "id": "H1",
     "t": "Sin internet",
     "steps": "Pon el modo avión e intenta registrar con foto y con búsqueda.",
     "expect": "Mensaje claro, sin que la app se cierre; al volver la señal funciona."
    },
    {
     "id": "H2",
     "t": "Cambio de día",
     "steps": "Deja la app abierta o en segundo plano pasada la medianoche.",
     "expect": "Al abrirla en la mañana muestra el día nuevo vacío."
    },
    {
     "id": "H3",
     "t": "Teclado",
     "steps": "En cualquier campo de texto, revisa que el teclado no tape lo que escribes.",
     "expect": "Siempre ves el campo y el botón de guardar."
    }
   ]
  },
  {
   "code": "J",
   "title": "Eliminar cuenta (solo cuenta de prueba)",
   "intro": null,
   "tests": [
    {
     "id": "J1",
     "t": "Eliminar cuenta",
     "steps": "Con la cuenta de prueba: Perfil → \"Eliminar mi cuenta y mis datos\". Luego intenta entrar con esos datos.",
     "expect": "Pide confirmación, borra todo y ya no deja entrar con esa cuenta."
    }
   ]
  }
 ],
 "scale": [
  {
   "id": "K1",
   "q": "¿Qué tan fácil es registrar lo que comes?"
  },
  {
   "id": "K2",
   "q": "¿Qué tan exactas te parecen las calorías y porciones?"
  },
  {
   "id": "K3",
   "q": "¿Qué tan probable es que la sigas usando después de esta prueba?"
  }
 ],
 "open": [
  {
   "id": "K4",
   "q": "¿Qué fue lo que más te gustó?"
  },
  {
   "id": "K5",
   "q": "¿Qué te confundió o te costó trabajo?"
  },
  {
   "id": "K6",
   "q": "¿Qué le falta para que la uses todos los días?"
  },
  {
   "id": "K7",
   "q": "Si costara alrededor de $129–179 al mes o $599–799 al año (con 7 días gratis), ¿la pagarías? ¿Por qué?"
  }
 ]
}
  };
})();

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
