# SNOC OPS Especificação Funcional do Sistema Plataforma unificada de Rondas, Passagem de Turno,...

SNOC OPS — Especificação Funcional do Sistema

Plataforma unificada de Rondas, Passagem de Turno, Controle de Acesso de Terceiros e Gestão de Atividades

DTI-AGU | Network Operations Center Para desenvolvimento no Lovable (React + Supabase)

1. Visão executiva

Hoje o SNOC opera com três processos que já existem em papel/PDF (Formulário de Rondas, POP de Passagem de Turno) mas não têm um sistema que os conecte. O objetivo é um único aplicativo web que:

Digitaliza rondas operacionais com evidência fotográfica e rastreabilidade de não conformidade;

Formaliza a passagem de turno com escalonamento automático se não for feita;

Controla fisicamente quem entra e sai do Data Center (fornecedores, prestadores, limpeza), amarrado a uma atividade/OS;

Gerencia o ciclo de vida de qualquer atividade técnica (principalmente troca de peças), com evidência fotográfica antes/depois, formulários anexados, e disparo automático de e-mail para fornecedores;

Autentica via AD/Entra ID, com 3 papéis (Operador, Gestor, Super Admin) e cada papel enxergando uma visão diferente do mesmo dado.

Isso é essencialmente a fusão de três categorias de produto que hoje existem separadas no mercado — NOC shift-log/handover tools, Visitor & Contractor Management System (VMS) de data center, e CMMS (Computerized Maintenance Management System) com evidência de vendor — dentro de um único app com o mesmo modelo de usuário e o mesmo banco de dados. Isso é uma vantagem real: hoje cada uma dessas categorias de sistema no mercado é vendida separada (Envoy/Vizitor para VMS, Oxmaint/mPulse para CMMS, ferramentas de shift-log dedicadas), e nenhuma delas conversa nativamente com as outras.

2. Personas e papéis (RBAC)

Papel Quem é O que vê / faz Operador SNOC Quem está de plantão no monitoramento Preenche rondas, faz passagem de turno, registra entrada/saída de terceiros, abre e acompanha atividades/OS, recebe notificações da própria fila Gestor AGU Coordenação/chefia do SNOC Visão consolidada (dashboards, indicadores, NC por criticidade, SLA de passagem de turno, histórico de fornecedores), aprova ações críticas, recebe escalonamento quando algo não foi feito Super Admin TI/administração do sistema Gestão de usuários e papéis, configuração de regras de notificação/escalonamento, cadastro de fornecedores e templates de e-mail, auditoria completa, configuração de integrações (AD, e-mail, SLA)

Login único via AD/Entra ID. O papel do usuário não é definido manualmente linha a linha — ele vem de grupos do AD mapeados dentro do sistema (ex: grupo SNOC-Operadores → papel Operador; SNOC-Gestores → papel Gestor). Isso é o padrão de mercado (ver seção 6) e evita a manutenção manual de permissões conforme pessoas entram/saem da equipe.

3. Módulos funcionais

3.1 Rondas Operacionais

Migra 1:1 o conteúdo do formulário oficial que vocês já têm (Data Center, UPS/Baterias, Climatização, Racks/Cabeamento, Controle de Acesso/CFTV, Ferramentas Operacionais), mas como formulário digital nativo, não como workflow de ITSM:

Cada seção com C / NC / NA por item, campo de observação obrigatório quando NC;

Upload de foto obrigatório quando NC — esse é o ponto que nenhum PDF resolve e é padrão em CMMS moderno: evidência fotográfica vinculada ao item específico, não solta;

Criticidade (Baixa/Média/Alta/Crítica) por seção, com regra: Crítica dispara notificação automática ao Gestor + Fila de Incidente, sem precisar que o operador lembre de avisar alguém;

Campo de temperatura/umidade com histórico em gráfico de série temporal (permite ver tendência ao longo do tempo, não só o valor pontual — isso é diferencial sobre o formulário em PDF);

Ao final, resumo automático (total de NC, classificação, se há pendência transferida) — calculado pelo sistema, não preenchido manualmente como no PDF.

3.2 Passagem de Turno

Também migra o conteúdo do POP que vocês têm (Anexo A), mas o ponto central pedido por você é o escalonamento automático:

Toda passagem de turno tem um prazo (ex: até 15 min após o início do turno seguinte);

Se o operador que assume não confirmar o aceite dentro do prazo, o sistema dispara notificação para a(s) chefia(s) configurada(s) — não uma pessoa fixa no código, e sim uma lista configurável em tela pelo Super Admin (ex: "se não houver aceite em 15 min, notificar Fulano e Beltrano; se não houver aceite em 30 min, notificar o Gestor geral");

Isso segue a literatura consolidada de shift handover em operações 24/7 (NOCs, estações de rastreio, resposta a incidentes): a passagem de turno existe para evitar que a equipe seguinte perca contexto quando há troca de responsabilidade — e a maioria dos erros operacionais sérios não vem de um erro único, vem justamente de contexto incompleto.

A estrutura de campos recomendada pela prática de mercado cobre: status dos sistemas (o que está degradado, o que está em bypass), incidentes ativos (severidade, impacto, timeline, hipótese, mitigação, próximo passo, responsável) e mudanças feitas (configurações, manutenções, atualizações). Isso já bate quase 1:1 com o Anexo A do seu POP, então a migração para o sistema é direta.

3.3 Controle de Acesso de Terceiros (Visitor & Contractor Management)

Este é o módulo novo que view não existe hoje em PDF algum. Baseado no que é padrão em VMS de data center:

Cadastro prévio do fornecedor/prestador (empresa, responsável técnico, documento, validade de contrato/credencial) — a prática de mercado é registrar, tanto no contrato quanto no cadastro do fornecedor no sistema, exatamente quais tarefas ele está autorizado a executar e qual evidência é exigida para cada uma, em vez de depender de confiança verbal;

Check-in/check-out amarrado a uma atividade (não é só "fulano entrou às 14h" solto — é "fulano entrou às 14h para executar a OS #1234, troca de nobreak do Rack 3");

Foto do documento e/ou do crachá no check-in;

Acompanhante interno (operador responsável por escoltar), seguindo a prática de que visitantes em áreas sensíveis normalmente precisam estar acompanhados por um responsável autorizado;

Log de acesso permanente e à prova de adulteração — todo evento de acesso armazenado com timestamp, identidade, zona e duração para histórico de auditoria ilimitado, ao invés do modelo de planilha/papel que hoje perde registros e não permite a um auditor verificar quem esteve na instalação dois meses atrás;

Alerta automático se o prestador ultrapassar o tempo previsto sem check-out (ex: "estimativa era 2h, já são 4h e não há check-out registrado").

3.4 Gestão de Atividades / Ordens de Serviço (com foco em troca de peças)

Este módulo cobre qualquer atividade — não só troca de peça, mas o fluxo de troca de peça é o mais crítico, então detalho ele:

Operador ou Gestor abre a Atividade/OS: tipo (manutenção preventiva, corretiva, troca de peça, instalação), ativo/equipamento afetado, criticidade, fornecedor responsável;

Disparo automático de e-mail para o fornecedor no momento da abertura (ou no agendamento), com os dados da OS e a janela de execução — usando um template configurável por tipo de atividade;

Fornecedor chega → check-in no módulo 3.3, vinculado a esta OS;

Durante a execução: campo de evidência fotográfica antes (estado do equipamento/peça antiga) e depois (peça nova instalada) — prática consolidada de CMMS: configurar o sistema para exigir documentação fotográfica antes que uma ordem de serviço possa ser marcada como concluída elimina a maior parte das disputas sobre se o trabalho foi realmente executado;

Upload de formulário/laudo do fornecedor (PDF/foto) anexado ao registro;

Check-out do fornecedor (módulo 3.3) → sistema pede confirmação de encerramento da OS;

Fechamento da OS gera registro permanente correlacionável — o padrão de mercado é que quando um auditor solicita o histórico de manutenção de um ativo, a resposta deve levar segundos, não dias, o oposto do que acontece hoje com pastas de fotos soltas e papel.

Esse fluxo fechado (abertura → e-mail automático → check-in → evidência → check-out → fechamento) é exatamente o que falta nos formulários em PDF que vocês têm hoje, e é o diferencial real do sistema novo.

3.5 Dashboards por perfil

Operador: fila de rondas pendentes do turno, atividades abertas sob sua responsabilidade, status da última passagem de turno;

Gestor: visão consolidada — NC por criticidade/mês, SLA de passagem de turno (% feita no prazo), fornecedores em campo agora, atividades críticas em aberto, tendência de temperatura/umidade do Data Center;

Super Admin: saúde do sistema, log de auditoria, gestão de usuários/papéis, configuração de regras de notificação.

3.6 Motor de Notificações e Escalonamento

Centraliza todo disparo de e-mail/notificação do sistema, configurável pelo Super Admin, sem precisar mexer em código:

Ronda com NC Crítica → notifica Gestor + fila de incidente;

Passagem de turno sem aceite dentro do prazo → notifica chefia configurada (escalonamento em níveis, como no exemplo acima);

Abertura de OS/atividade → e-mail automático ao fornecedor;

Prestador sem check-out após o tempo estimado → notifica operador responsável e, se persistir, o Gestor;

Fechamento do mês → gera e envia o relatório consolidado (detalhado na seção 3.7);

Todo disparo fica registrado (quem foi notificado, quando, por qual regra) para auditoria.

3.7 Fechamento Mensal e Relatório Automático

Todo mês, no fechamento (ex: dia 1º às 06h, cobrindo o mês anterior), o sistema gera automaticamente um relatório consolidado e dispara por e-mail para a lista de gestão pré-configurada — sem depender de alguém lembrar de exportar nada.

Conteúdo do relatório (consolidado, não é o dado bruto de cada ronda/passagem):

Rondas: total de rondas realizadas x previstas no mês, total de NC por criticidade, seção com maior recorrência de NC (ex: "Climatização foi a seção com mais NC em 3 dos 4 turnos"), tendência de temperatura/umidade do mês;

Passagem de turno: % de passagens aceitas dentro do prazo, quantas precisaram de escalonamento e para quem, pendências que ficaram abertas por mais de X dias;

Controle de acesso de terceiros (quando esse módulo estiver ativo): total de visitas por fornecedor, tempo médio em campo, quantos check-outs em atraso;

Atividades/OS (quando esse módulo estiver ativo): total de OS abertas/fechadas, tempo médio de fechamento por fornecedor, quantas tiveram evidência fotográfica completa vs. incompleta.

Como funciona tecnicamente:

Job agendado (Supabase Edge Function + pg_cron, ou equivalente) roda no fechamento do mês, consulta os dados do período e monta o relatório;

Gerado como PDF anexado ao e-mail (reaproveita o mesmo motor de e-mail transacional do módulo 3.6/3.4);

Lista de destinatários é configurável pelo Super Admin, do mesmo jeito que as regras de escalonamento (não fica fixa em código) — pode ter listas diferentes por tipo de relatório (ex: relatório de Rondas vai para o Gestor do SNOC; relatório de Fornecedores vai também para o setor de Contratos);

Todo relatório gerado fica arquivado e pesquisável no dashboard do Gestor (histórico mês a mês), não só enviado por e-mail e esquecido — assim dá pra comparar tendência entre meses sem precisar procurar em caixa de entrada.

4. Requisitos não funcionais

4.1 Sessão persistente

Você pediu que a sessão não expire a menos que o agente saia manualmente. Tecnicamente isso é possível (refresh token de vida longa + renovação silenciosa em background), mas vale registrar o trade-off antes de travar essa decisão: sessões sem expiração automática são um vetor de risco em ambiente de governo, especialmente em estações compartilhadas de NOC — se alguém esquecer de deslogar num terminal físico do centro de operações, a sessão fica aberta indefinidamente para quem passar ali depois.

Sugestão de meio-termo, sem contrariar o que você pediu:

Sessão de fato não expira por tempo (conforme solicitado);

Mas o Super Admin tem um painel de sessões ativas com opção de revogar remotamente qualquer sessão;

E existe um log de "última atividade" por sessão, para o Gestor identificar sessões esquecidas abertas.

Isso preserva "não expira a menos que o agente saia" e ainda dá uma rede de segurança administrativa, sem forçar logout automático no meio de um plantão.

4.2 Autenticação (AD / Entra ID)

Dois cenários possíveis, dependendo de qual AD a AGU usa:

Se for Azure AD / Microsoft Entra ID (mais comum hoje em órgãos que usam M365): integração direta via SAML 2.0 ou OIDC. O Supabase suporta single sign-on usando Azure AD, e a própria Lovable já expõe essa configuração pela interface de chat quando conectado ao backend nativo: configurar auth através do Lovable — habilitar provedores de login social e mudar configurações de auth pelo chat, incluindo SAML SSO — funciona no backend nativo. Isso é literalmente pedir para a IA do Lovable configurar durante o desenvolvimento.

Se for AD on-premise "puro" (LDAP, sem Entra ID): não dá para autenticar direto do navegador contra um LDAP interno. É necessário federar via ADFS ou Azure AD Connect primeiro (que já é uma peça comum em infra de governo) para expor isso como SAML/OIDC, e então integrar o Supabase Auth nesse ponto.

Vale confirmar com a equipe de infraestrutura da AGU qual dos dois cenários vocês têm antes de começar a construir esse pedaço no Lovable.

4.3 Auditoria e LGPD

Como o sistema guarda dados pessoais de terceiros (nome, documento, foto) e trata de infraestrutura crítica de um órgão público, vale desde já:

Log de auditoria imutável (quem fez o quê, quando) em todas as tabelas sensíveis;

Política de retenção de dados de visitantes/fornecedores definida (ex: 5 anos, alinhado ao que já fizeram no POP);

Consentimento/aviso de tratamento de dados no check-in de terceiros (LGPD, art. 7º/9º).

5. Modelo de dados (entidades principais)

usuarios            (id, nome, email, papel, grupo_ad, ativo)
rondas               (id, data, turno, localidade, responsavel_id, resultado_geral, total_nc)
ronda_itens          (id, ronda_id, secao, item, status_c_nc_na, observacao, foto_url, criticidade)
passagens_turno      (id, data, turno, operador_entrega_id, operador_recebe_id, status_aceite, prazo_aceite, aceito_em)
passagem_pendencias  (id, passagem_id, descricao, responsavel, prazo, risco)
fornecedores         (id, razao_social, contato, documento, validade_credencial)
visitas              (id, fornecedor_id, atividade_id, pessoa_nome, documento, foto_documento, checkin_em, checkout_em, acompanhante_id)
atividades           (id, tipo, ativo_afetado, criticidade, fornecedor_id, status, aberta_por, aberta_em, fechada_em)
atividade_evidencias (id, atividade_id, tipo(antes/depois/laudo), arquivo_url, enviado_por, enviado_em)
notificacoes         (id, regra, destinatario, canal, enviado_em, referencia_tipo, referencia_id)
regras_escalonamento (id, evento, prazo_minutos, destinatarios, nivel)
relatorios_mensais   (id, tipo(rondas/passagem/fornecedores/atividades), periodo_referencia, gerado_em, arquivo_pdf_url, destinatarios)


6. Arquitetura técnica recomendada (Lovable + Supabase)

Frontend: React (padrão Lovable), com Tailwind — já é o stack nativo do Lovable, sem trabalho extra;

Backend: Supabase (Postgres + Auth + Storage) — Storage para as fotos de evidência (rondas, atividades, documentos de visitantes), Row Level Security por papel para garantir que Operador não veja o painel de configuração do Gestor;

Auth: SAML/OIDC com Azure AD/Entra ID (seção 4.2), com grupos do AD mapeados para os 3 papéis;

E-mail transacional: para o disparo automático a fornecedores, Lovable recomenda usar o backend nativo se quiser enviar do seu próprio domínio: enviar e-mails do seu próprio domínio requer o backend nativo — importante decidir isso cedo, porque muda a integração;

Fotos/evidências: Supabase Storage com URLs assinadas (não públicas), já que são fotos de infraestrutura crítica e de documentos de terceiros.

7. Roadmap sugerido (fases de construção no Lovable)

Fase Escopo Por quê nessa ordem 1. Fundação Auth (AD/Entra ID), papéis, estrutura de banco, layout base por perfil Sem isso nada mais funciona com segurança 2. Rondas digitais Módulo 3.1 completo, com upload de foto É o processo que vocês já têm mais maduro (formulário pronto) — mais rápido de validar 3. Passagem de turno Módulo 3.2 + motor de notificação básico (escalonamento) Reaproveita o motor de notificação que o módulo 4 também vai precisar 4. Controle de acesso de terceiros Módulo 3.3 Depende de fornecedores cadastrados, então vem depois da fundação 5. Atividades/OS + e-mail automático Módulo 3.4, conectando com 3.3 (check-in amarrado à OS) É o módulo mais complexo, faz sentido vir por último quando os outros três já sustentam ele 6. Dashboards do Gestor Módulo 3.5 Só faz sentido com dados reais das fases 2–5 já entrando 7. Fechamento mensal automático Módulo 3.7 Depende de já ter pelo menos um mês inteiro de dados reais das fases 2 e 3 rodando para gerar o primeiro relatório de verdade

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3259c89b-d217-4d50-a74e-a652951bc7b9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
