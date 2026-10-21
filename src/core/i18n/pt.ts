/** Mensagens em português — a fonte da verdade para as chaves de tradução. */
export const pt = {
  // Comum
  'common.back': 'Voltar',

  // Home (botão do menu)
  'home.menuButton': 'Menu',
  'home.menuButtonUnread': 'Menu — há novidades não lidas',

  // Menu (sheet do botão no topo direito)
  'menu.feedback': 'Enviar feedback',
  'menu.language': 'Idioma',
  'menu.news': 'Novidades',
  'menu.donate': 'Apoiar o app',
  'menu.login': 'Entrar',

  // Auth
  'auth.title': 'Entrar',
  'auth.subtitle': 'Entre para sincronizar seus dados em qualquer aparelho.',
  'auth.google': 'Continuar com Google',
  'auth.or': 'ou',
  'auth.email': 'Email',
  'auth.password': 'Senha',
  'auth.signIn': 'Entrar',
  'auth.signUp': 'Criar conta',
  'auth.toSignUp': 'Não tem conta? Criar',
  'auth.toSignIn': 'Já tem conta? Entrar',
  'auth.guestNote': 'Você pode continuar usando sem conta.',
  'auth.soon': 'O login estará disponível em breve.',
  'auth.error': 'Não deu para entrar. Confira os dados e tente de novo.',
  'auth.checkEmailTitle': 'Confirme seu e-mail',
  'auth.checkEmailBody':
    'Se este endereço ainda não tiver conta, enviamos um link de confirmação para {email}. Abra o link para ativar a conta e entrar.',
  'auth.checkEmailSpam':
    'Não chegou? Confira o spam — pode levar alguns minutos.',
  'auth.backToSignIn': 'Voltar para entrar',
  'auth.signedInAs': 'Conectado como',
  'auth.signOut': 'Sair',

  // Feedback
  'feedback.title': 'Enviar feedback',
  'feedback.intro': 'Sua opinião ajuda a melhorar o app. Conte o que achou.',
  'feedback.typeLabel': 'Tipo',
  'feedback.type.bug': 'Problema',
  'feedback.type.idea': 'Ideia',
  'feedback.type.other': 'Outro',
  'feedback.messageLabel': 'Mensagem',
  'feedback.messagePlaceholder': 'O que aconteceu? O que podia ser melhor?',
  'feedback.emailLabel': 'Seu email (opcional)',
  'feedback.emailPlaceholder': 'para retornarmos, se precisar',
  'feedback.send': 'Enviar',
  'feedback.sentTitle': 'Obrigado!',
  'feedback.sentBody': 'Recebemos seu feedback. 🙌',
  'feedback.sentMailBody': 'Abrimos seu email com o feedback — é só enviar. 🙌',
  'feedback.error':
    'Não foi possível enviar agora. Tente de novo em instantes.',
  'feedback.another': 'Enviar outro',

  // Doações
  'donate.title': 'Apoiar o app',
  'donate.body':
    'Este app é gratuito. Se ele é útil pra você, uma doação de qualquer valor ajuda a manter os servidores e o desenvolvimento.',
  'donate.button': 'Fazer uma doação',
  'donate.thanks': 'Qualquer valor faz diferença. Obrigado! 💜',
  'donate.soon': 'As doações estarão disponíveis em breve.',

  // Idioma
  'language.title': 'Idioma',
  'language.subtitle': 'Escolha o idioma do app.',

  // Novidades (changelog)
  'news.title': 'Novidades',
  'news.subtitle': 'O que há de novo no app.',
  'news.badgeNew': 'novo',

  // Admin (painel do operador — /admin)
  'admin.title': 'Admin',
  'admin.restricted': 'Área restrita.',
  'admin.users': 'Usuários',
  'admin.dau': 'DAU',
  'admin.wau': 'WAU',
  'admin.mau': 'MAU',
  'admin.feedback': 'Feedbacks',
  'admin.sessionsByDay': 'Sessões por dia (30d)',
  'admin.noData': 'Sem dados ainda.',
  'admin.feedbackInbox': 'Feedback recebido',
  'admin.feedbackEmpty': 'Nenhum feedback ainda.',

  // Toast de atualização
  'update.available': 'Nova versão disponível',
  'update.action': 'Atualizar',
  'update.updating': 'Atualizando…',
  'update.dismiss': 'Dispensar',

  // Jogo (HUD)
  'game.name': 'Fissura',
  'game.biomass': 'Biomassa',
  'game.ore': 'Minério',
  'game.core': 'Núcleo',
  'game.hordeDormant': 'Horda {n}/{total} · subsolo quieto',
  'game.hordeIn': 'Horda {n}/{total} em {s}s',
  'game.hordeWarning': 'Tremor! Horda {n}/{total} em {s}s',
  'game.hordeActive': 'Horda {n}/{total}: {left} criaturas',
  'game.collector': 'Coletor',
  'game.turret': 'Torreta',
  'game.tools': 'Brocas',
  'game.toolsLevel': 'Brocas x{n}',
  'game.explore': 'Explorar',
  'game.cancel': 'Cancelar',
  'game.close': 'Fechar',
  'game.merge': 'Combinar',
  'game.level': 'Nv.{n}',
  'game.levelMax': 'Nível máximo',
  'game.unitTurret': 'Torreta Nv.{n}',
  'game.unitCollector': 'Coletor Nv.{n}',
  'game.turretStats': 'dano {damage} · alcance {range}',
  'game.collectorStats': 'força {power} por golpe',
  'game.mergeTip': 'Toque em outra igual para combinar',
  'game.mergeNone': 'Construa outra igual para combinar',
  'game.restart': 'Jogar de novo',
  'game.wonTitle': 'Colônia estabilizada',
  'game.wonBody':
    'As {waves} hordas foram contidas. A fissura se fecha por enquanto.',
  'game.lostTitle': 'O núcleo caiu',
  'game.lostBody':
    'As criaturas tomaram a refinaria. Tente defender mais cedo.',
  'game.statsTaps': '{n} toques',
  'game.statsCollected': '{bio} biomassa · {ore} minério',
  'game.statsMerges': '{n} combinações · {k} criaturas',
  'game.canvasLabel':
    'Mapa da colônia. Toque nos elementos para coletar, arraste para mover a câmera.',
  'game.aboutTitle': 'Fissura — POC',
  'game.aboutBody':
    'Uma colônia de humanos e robôs raspa a superfície de um mundo industrial morto. O que dorme no subsolo acordou.',

  // Regiões do mapa
  'region.colony': 'Colônia',
  'region.forest': 'Bosque tóxico',
  'region.fissure': 'Fissura',
  'region.fungus': 'Campo de fungos',
  'region.quarry': 'Pedreira',
  'region.ruins': 'Ruínas',
  'region.field': 'Campo',
  'region.scrapyard': 'Ferro-velho',
  'region.wastes': 'Ermos',

  // Dicas (uma linha de cada vez, guiando o ciclo)
  'hint.tap':
    'Toque numa árvore ou pedra. Cada toque desgasta; ao cair, você recebe o recurso.',
  'hint.more':
    'Continue coletando: o Coletor custa {biomass} biomassa e {ore} minério.',
  'hint.buyCollector':
    'Já dá para comprar um Coletor: ele repete os toques sozinho.',
  'hint.automation':
    'O coletor trabalha sozinho. Seus toques continuam acelerando.',
  'hint.explore': 'Toque na névoa ao lado para mandar a sonda revelar a área.',
  'hint.buildTurret': 'Construa torretas: algo se mexe no subsolo.',
  'hint.place': 'Toque num tile livre (marcado) para posicionar a torreta.',
  'hint.merge': 'Toque numa torreta e depois em outra igual para combinar.',
  'hint.mergeSelect':
    'Agora toque em outra torreta do mesmo nível para combinar.',
  'hint.hordeIncoming': 'Tremor! A fissura a leste vai cuspir criaturas.',
  'hint.hordeNow': 'Horda! Defenda o núcleo. Tocar nas criaturas também ajuda.',
  'hint.hordeCleared': 'Horda contida. Volte a coletar e reforce as defesas.',
  'hint.placeInvalid': 'Aqui não dá: precisa ser um tile livre e revelado.',
  'hint.noResources': 'Recursos insuficientes.',
}
