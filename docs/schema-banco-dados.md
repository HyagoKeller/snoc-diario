# SNOC — Schema do Banco de Dados

> Documento gerado a partir do banco em produção em 2026-10-13.
> As migrações aplicadas vivem em `supabase/migrations/` (fonte da verdade).
> Todas as 18 tabelas do schema `public` têm **RLS habilitado**.

## Visão geral

| Área | Tabelas |
| --- | --- |
| Identidade e acesso | `profiles`, `user_roles` |
| Rondas | `rondas`, `ronda_itens` |
| Passagem de turno | `passagens_turno`, `passagem_pendencias` |
| Terceiros e visitas | `fornecedores`, `visitas` |
| Atividades / OS | `atividades`, `atividade_evidencias` |
| Notificações e regras | `notificacoes`, `regras_escalonamento` |
| Relatórios | `relatorios_mensais` |
| Configurações e integrações | `integracoes_config`, `turnos_equipe`, `turno_membros`, `arquivos_externos` |
| Auditoria | `auditoria` |

## Tipos enumerados

| Tipo | Valores |
| --- | --- |
| `app_role` | `operador`, `gestor`, `super_admin` |
| `criticidade` | `baixa`, `media`, `alta`, `critica` |
| `atividade_tipo` | `preventiva`, `corretiva`, `troca_peca`, `instalacao` |
| `atividade_status` | `aberta`, `agendada`, `em_execucao`, `aguardando_fechamento`, `fechada`, `cancelada` |
| `evidencia_tipo` | `antes`, `depois`, `laudo` |
| `item_status` | `C` (conforme), `NC` (não conforme), `NA` (não se aplica) |
| `aceite_status` | `pendente`, `aceito`, `escalonado` |

## Tabelas

### profiles
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| nome | text NOT NULL | DEFAULT '' |
| email | text NOT NULL | DEFAULT '' |
| grupo_ad | text | Grupo do Active Directory |
| ativo | boolean NOT NULL | DEFAULT false (liberado por gestor após primeiro acesso) |
| created_at / updated_at | timestamptz NOT NULL | DEFAULT now() |

### user_roles
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK, DEFAULT gen_random_uuid() |
| user_id | uuid NOT NULL | FK → `auth.users(id)` ON DELETE CASCADE |
| role | app_role NOT NULL | |
| created_at | timestamptz NOT NULL | DEFAULT now() |

Restrição: `UNIQUE (user_id, role)`. Papéis nunca ficam em `profiles` (anti-escalação de privilégio).

### rondas
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK, DEFAULT gen_random_uuid() |
| data | date NOT NULL | DEFAULT CURRENT_DATE |
| turno | text NOT NULL | |
| localidade | text NOT NULL | DEFAULT 'Data Center AGU' |
| responsavel_id | uuid NOT NULL | FK → `auth.users(id)` ON DELETE CASCADE |
| temperatura | numeric | |
| umidade | numeric | |
| resultado_geral | criticidade NOT NULL | DEFAULT 'baixa' |
| total_nc | integer NOT NULL | DEFAULT 0 |
| observacoes | text | |
| finalizada | boolean NOT NULL | DEFAULT false |
| created_at / updated_at | timestamptz NOT NULL | DEFAULT now() |
| chamado_itsm | text | Legado (1 chamado) |
| chamado_itsm_cache | jsonb | Cache do InvGate |
| ronda_anterior_id | uuid | FK → `rondas(id)` ON DELETE SET NULL |
| chamados_itsm | text[] NOT NULL | DEFAULT '{}' (múltiplos chamados) |
| chamados_itsm_cache | jsonb NOT NULL | DEFAULT '[]' |

### ronda_itens
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| ronda_id | uuid NOT NULL | FK → `rondas(id)` ON DELETE CASCADE |
| secao | text NOT NULL | |
| item | text NOT NULL | |
| status | item_status NOT NULL | DEFAULT 'C' |
| observacao | text | |
| foto_url | text | Evidência no bucket privado `evidencias` |
| criticidade | criticidade | |
| created_at | timestamptz NOT NULL | DEFAULT now() |

### passagens_turno
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| data | date NOT NULL | DEFAULT CURRENT_DATE |
| turno | text NOT NULL | Madrugada · Manhã · Tarde · Noite (6h cada) |
| operador_entrega_id | uuid NOT NULL | FK → `auth.users(id)` ON DELETE CASCADE |
| operador_recebe_id | uuid | FK → `auth.users(id)` ON DELETE SET NULL |
| status_sistemas | text | |
| incidentes_ativos | text | |
| mudancas_realizadas | text | |
| status_servicos_tier0 | text | |
| contingencia_ativa | boolean NOT NULL | DEFAULT false |
| contingencia_descricao | text | |
| status_aceite | aceite_status NOT NULL | DEFAULT 'pendente' |
| prazo_aceite | timestamptz NOT NULL | DEFAULT now() + 15 min |
| aceito_em | timestamptz | |
| chamados_itsm | text[] NOT NULL | DEFAULT '{}' |
| chamados_itsm_cache | jsonb NOT NULL | DEFAULT '[]' |
| created_at / updated_at | timestamptz NOT NULL | DEFAULT now() |

### passagem_pendencias
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| passagem_id | uuid NOT NULL | FK → `passagens_turno(id)` ON DELETE CASCADE |
| descricao | text NOT NULL | |
| responsavel | text | |
| prazo | date | |
| risco | criticidade NOT NULL | DEFAULT 'baixa' |
| resolvida | boolean NOT NULL | DEFAULT false |
| created_at | timestamptz NOT NULL | DEFAULT now() |

### fornecedores
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| razao_social | text NOT NULL | |
| contato_nome / contato_email / contato_telefone | text | |
| documento | text | |
| validade_credencial | date | |
| tarefas_autorizadas | text | |
| ativo | boolean NOT NULL | DEFAULT true |
| cnpj | text | |
| apolice_seguro | text | |
| seguro_validade | date | |
| avaliacao_media | numeric(3,2) | DEFAULT NULL |
| created_at / updated_at | timestamptz NOT NULL | DEFAULT now() |

### atividades (ordens de serviço)
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| codigo | integer NOT NULL | Sequence `atividades_codigo_seq` |
| tipo | atividade_tipo NOT NULL | |
| titulo | text NOT NULL | |
| descricao | text | |
| ativo_afetado | text | |
| patrimonio_serial | text | Patrimônio ou serial number |
| criticidade | criticidade NOT NULL | DEFAULT 'media' |
| fornecedor_id | uuid | FK → `fornecedores(id)` ON DELETE SET NULL |
| status | atividade_status NOT NULL | DEFAULT 'aberta' |
| janela_inicio / janela_fim | timestamptz | |
| aberta_por | uuid NOT NULL | FK → `auth.users(id)` ON DELETE CASCADE |
| aberta_em | timestamptz NOT NULL | DEFAULT now() |
| fechada_em | timestamptz | |
| email_enviado_em | timestamptz | |
| chamado_itsm | text | Legado |
| chamado_itsm_cache | jsonb | |
| chamados_itsm | text[] NOT NULL | DEFAULT '{}' |
| chamados_itsm_cache | jsonb NOT NULL | DEFAULT '[]' |
| numero_os_fornecedor | text | |
| custo | numeric(12,2) | `patrimonio_serial` substituiu o campo de custo estimado |
| garantia_ate | date | |
| nota_fiscal_url | text | |
| updated_at | timestamptz NOT NULL | DEFAULT now() |

### atividade_evidencias
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| atividade_id | uuid NOT NULL | FK → `atividades(id)` ON DELETE CASCADE |
| tipo | evidencia_tipo NOT NULL | `antes` / `depois` / `laudo` |
| arquivo_url | text NOT NULL | Bucket privado `evidencias` |
| descricao | text | |
| enviado_por | uuid NOT NULL | FK → `auth.users(id)` ON DELETE CASCADE |
| enviado_em | timestamptz NOT NULL | DEFAULT now() |
| aprovado_por | uuid | FK → `auth.users(id)` ON DELETE SET NULL |
| aprovado_em | timestamptz | |

### visitas
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| fornecedor_id | uuid | FK → `fornecedores(id)` ON DELETE SET NULL |
| atividade_id | uuid | FK → `atividades(id)` ON DELETE SET NULL |
| pessoa_nome | text NOT NULL | Visitante ou líder do grupo (modalidade `grupo`) |
| documento | text | |
| tipo_documento | text | |
| foto_documento_url | text | Bucket privado |
| zona | text NOT NULL | DEFAULT 'Sala de Servidores' (ex.: Data Center Sede 1 / Sede 3) |
| checkin_em | timestamptz NOT NULL | DEFAULT now() |
| checkout_em | timestamptz | |
| duracao_prevista_min | integer NOT NULL | DEFAULT 120 |
| acompanhante_id | uuid | FK → `auth.users(id)` ON DELETE SET NULL |
| consentimento_lgpd | boolean NOT NULL | DEFAULT false |
| registrado_por | uuid NOT NULL | FK → `auth.users(id)` ON DELETE CASCADE |
| modalidade | text NOT NULL | DEFAULT 'individual' (`individual` ou `grupo`) |
| ficha_registro | jsonb NOT NULL | DEFAULT '{}' — ficha completa (campos + equipamentos) |
| chamados_itsm | text[] NOT NULL | DEFAULT '{}' |
| chamados_itsm_cache | jsonb NOT NULL | DEFAULT '[]' |
| assinatura_saida_path | text | Assinatura de saída (PNG no bucket privado) |
| checkout_registrado_por | uuid | Quem registrou o check-out |
| placa_veiculo | text | DEPRECATED (operação em tablet não usa veículos) |
| motivo_visita | text | |
| created_at / updated_at | timestamptz NOT NULL | DEFAULT now() |

### turnos_equipe
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| turno | text NOT NULL | UNIQUE (Madrugada, Manhã, Tarde, Noite) |
| grupo_ad | text | Grupo do AD usado para popular a equipe |
| coordenadores | text | E-mails da coordenação do turno |
| ativo | boolean NOT NULL | DEFAULT true |
| created_at / updated_at | timestamptz NOT NULL | DEFAULT now() |

### turno_membros
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| turno_id | uuid NOT NULL | FK → `turnos_equipe(id)` ON DELETE CASCADE |
| user_id | uuid NOT NULL | FK → `auth.users(id)` ON DELETE CASCADE |
| papel_turno | text NOT NULL | DEFAULT 'tecnico' |
| ordem | integer NOT NULL | DEFAULT 1 (ordem de recebimento da passagem) |
| ativo | boolean NOT NULL | DEFAULT true |
| created_at | timestamptz NOT NULL | DEFAULT now() |

Restrição: `UNIQUE (turno_id, user_id)`.

### regras_escalonamento
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| evento | text NOT NULL | Ex.: `ronda_nc`, `saida_equipamento`, `contingencia_ativa` |
| prazo_minutos | integer NOT NULL | DEFAULT 15 |
| destinatarios | text NOT NULL | E-mails explícitos |
| nivel | integer NOT NULL | DEFAULT 1 |
| ativa | boolean NOT NULL | DEFAULT true |
| criticidade_minima | criticidade | Regra só dispara a partir desta criticidade |
| notificar_coordenadores | boolean NOT NULL | DEFAULT false |
| notificar_gestores | boolean NOT NULL | DEFAULT false |
| canal | text NOT NULL | DEFAULT 'email' (email / teams) |
| observacao | text | |
| created_at / updated_at | timestamptz NOT NULL | DEFAULT now() |

### notificacoes
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| regra | text NOT NULL | Evento que originou |
| destinatario | text NOT NULL | |
| canal | text NOT NULL | DEFAULT 'email' |
| assunto / corpo | text | |
| enviado_em | timestamptz NOT NULL | DEFAULT now() |
| referencia_tipo | text | |
| referencia_id | uuid | |

### relatorios_mensais
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| tipo | text NOT NULL | |
| periodo_referencia | text NOT NULL | Ex.: `2026-09` |
| conteudo | jsonb | KPIs consolidados |
| gerado_em | timestamptz NOT NULL | DEFAULT now() |
| arquivo_pdf_url | text | |
| destinatarios | text | Inclui endereço do Teams configurado |

### integracoes_config
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| chave | text NOT NULL | UNIQUE — ex.: `visitas_ui_json`, `teams_relatorio_endereco` |
| valor | text NOT NULL | JSON ou texto |
| atualizado_por | uuid | FK → `auth.users(id)` ON DELETE SET NULL |
| updated_at | timestamptz NOT NULL | DEFAULT now() |

### arquivos_externos
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| entidade | text NOT NULL | Ex.: `ronda`, `atividade`, `visita` |
| entidade_id | uuid | |
| destino | text NOT NULL | DEFAULT 'sharepoint' |
| pasta | text NOT NULL | Pasta ano/mês no SharePoint |
| nome_arquivo | text NOT NULL | |
| web_url | text | Link do arquivo no SharePoint |
| tamanho_bytes | bigint | |
| enviado_por | uuid NOT NULL | FK → `auth.users(id)` |
| created_at / updated_at | timestamptz NOT NULL | DEFAULT now() |

### auditoria
| Coluna | Tipo | Obs. |
| --- | --- | --- |
| id | uuid | PK |
| usuario_id | uuid | FK → `auth.users(id)` ON DELETE SET NULL |
| acao | text NOT NULL | |
| entidade | text NOT NULL | |
| entidade_id | uuid | |
| detalhes | jsonb | |
| created_at | timestamptz NOT NULL | DEFAULT now() |

## Funções (schema public)

| Função | Assinatura | SECURITY DEFINER | Uso |
| --- | --- | --- | --- |
| `handle_new_user()` | trigger | Sim | Cria perfil inativo no cadastro (primeiro acesso pendente de aprovação) |
| `has_role(_user_id uuid, _role app_role)` | → boolean | Sim | Consulta de papéis sem recursão de RLS |
| `is_manager(_user_id uuid)` | → boolean | Sim | Verdade para `gestor` ou `super_admin` |
| `update_updated_at_column()` | trigger | Não | Atualiza `updated_at` |
| `validar_assinatura_checkout_visita()` | trigger | Não | Exige assinatura e responsável no check-out; bloqueia alteração de saída já assinada |

## Gatilhos

| Tabela | Gatilho | Função |
| --- | --- | --- |
| `rondas`, `passagens_turno`, `fornecedores`, `atividades`, `visitas`, `regras_escalonamento`, `integracoes_config`, `turnos_equipe`, `arquivos_externos` | `trg_*_updated` (BEFORE UPDATE) | `update_updated_at_column()` |
| `visitas` | `validar_assinatura_checkout_visita` (BEFORE INSERT OR UPDATE) | `validar_assinatura_checkout_visita()` |
| `auth.users` | gatilho de cadastro (gerido pelo Supabase Auth) | `handle_new_user()` |

## Segurança (RLS)

Todas as tabelas têm RLS habilitado. Privilégios de `anon`, `authenticated` e `service_role` sobre as tabelas do `public` estão liberados no nível do banco; **o que manda é a política de RLS** de cada tabela — sem política aplicável, a linha não é visível.

| Tabela | Leitura | Escrita |
| --- | --- | --- |
| `profiles` | autenticados | próprio perfil; gestores atualizam qualquer um |
| `user_roles` | autenticados | gestores (exceto `super_admin`); `super_admin` só concedido/removido por quem já é `super_admin` |
| `rondas` / `ronda_itens` | autenticados | responsável da ronda; gestores alteram/excluem |
| `passagens_turno` / `passagem_pendencias` | autenticados | entrega pelo operador; aceite/alteração por entrega, recebimento ou gestor |
| `atividades` / `atividade_evidencias` | autenticados | abertura pelo autor; exclusão por gestores |
| `fornecedores` | autenticados | todos os autenticados (escrita livre) |
| `visitas` | autenticados | check-in pelo registrador; check-out exige assinatura (gatilho); exclusão só `super_admin` |
| `turnos_equipe` / `turno_membros` | autenticados | apenas `super_admin` |
| `regras_escalonamento` | autenticados (leitura) | apenas `super_admin` |
| `integracoes_config` | autenticados (leitura) | apenas `super_admin` |
| `notificacoes` | autenticados | inserção por autenticados (motor de notificações) |
| `relatorios_mensais` | gestores | gestores |
| `auditoria` | gestores | inserção pelo próprio usuário |
| `arquivos_externos` | autenticados | pelo autor; exclusão por gestores |

## Armazenamento

- Bucket **`evidencias`** (privado): fotos de rondas, documentos de visitas, assinaturas de saída, evidências de atividades. Acesso sempre por URL assinada de curta duração.
- Arquivos institucionais externos ficam no **SharePoint** (pasta ano/mês), registrados em `arquivos_externos`.

## Integrações

- **Microsoft 365 / AD**: identidade primária (OAuth Microsoft); perfis ficam pendentes até atribuição de papel; sessão encerrada a cada mudança de turno (00h/06h/12h/18h).
- **InvGate**: credenciais como segredos de servidor; números de chamados gravados em `chamados_itsm` com cache em `chamados_itsm_cache`.
- **SharePoint**: credenciais como segredos de servidor; gravação em pasta `YYYY/MM-NomeMes` e registro em `arquivos_externos`.
- **Teams**: endereço configurável em `integracoes_config` (`teams_relatorio_endereco`); relatórios registrados com canal `teams`.
