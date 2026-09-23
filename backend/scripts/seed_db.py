"""Popula a base de dados com denúncias, utilizadores e histórico fictícios para demonstração.

As denúncias e contas aqui descritas são inteiramente fictícias, criadas apenas
para demonstrar o dashboard, a auditoria e o fluxo de validação do protótipo.
Não correspondem a factos nem pessoas reais.

Uso:
    python scripts/seed_db.py
"""

import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models.audit_log import AuditLog, TipoOperacao  # noqa: E402
from app.models.denuncia import Categoria, Denuncia, EstadoDenuncia, Prioridade  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402
from app.utils.security import hash_password  # noqa: E402

DEMO_EMAIL = "tecnico@gccc.gov.mz"
DEMO_PASSWORD = "Admin123!"

AGORA = datetime.utcnow()
ANO = AGORA.year

_UTILIZADORES = [
    dict(name="Técnico GCCC", email=DEMO_EMAIL, role=UserRole.TECNICO, last_login_delta=timedelta(hours=2)),
    dict(
        name="Coordenação de análise",
        email="coordenacao@gccc.gov.mz",
        role=UserRole.COORDENADOR,
        last_login_delta=timedelta(hours=5),
    ),
    dict(
        name="Administração de sistema",
        email="admin@gccc.gov.mz",
        role=UserRole.ADMIN,
        last_login_delta=timedelta(days=1),
    ),
    dict(
        name="Técnico — Sofala",
        email="sofala@gccc.gov.mz",
        role=UserRole.TECNICO,
        last_login_delta=timedelta(days=1, hours=6),
    ),
    dict(
        name="Técnico — Nampula",
        email="nampula@gccc.gov.mz",
        role=UserRole.TECNICO,
        last_login_delta=timedelta(days=3),
    ),
    dict(
        name="Gabinete jurídico",
        email="juridico@gccc.gov.mz",
        role=UserRole.CONSULTA,
        last_login_delta=timedelta(days=4),
    ),
    dict(
        name="Técnico — Tete",
        email="tete@gccc.gov.mz",
        role=UserRole.TECNICO,
        last_login_delta=timedelta(days=60),
        ativo=False,
    ),
]

_SEED = [
    dict(
        dias_atras=9,
        categoria=Categoria.SUBORNO,
        confianca=0.93,
        prioridade=Prioridade.MEDIA,
        estado=EstadoDenuncia.ARQUIVADA,
        local="Posto de fronteira, Ressano Garcia",
        descricao=(
            "Um funcionário aduaneiro terá exigido um pagamento em numerário, fora do recibo "
            "oficial, para liberar mercadoria já com os documentos em ordem."
        ),
        validar=True,
    ),
    dict(
        dias_atras=8,
        categoria=Categoria.CORRUPCAO_ELEITORAL,
        confianca=0.79,
        prioridade=Prioridade.CRITICA,
        estado=EstadoDenuncia.ENCAMINHADA,
        local="Assembleia distrital, Nampula",
        descricao=(
            "Relato de distribuição de bens em troca de promessas de voto durante um encontro "
            "de campanha, com fotografias que mostram a entrega dos bens."
        ),
        validar=True,
    ),
    dict(
        dias_atras=6,
        categoria=Categoria.OUTROS,
        confianca=0.42,
        prioridade=Prioridade.BAIXA,
        estado=EstadoDenuncia.PENDENTE_VALIDACAO,
        local="Repartição de finanças, Beira",
        descricao=(
            "Descrição vaga de um atendimento considerado injusto, sem indicação clara de "
            "vantagem pedida ou oferecida a um funcionário público."
        ),
        validar=False,
    ),
    dict(
        dias_atras=5,
        categoria=Categoria.TRAFICO_DE_INFLUENCIA,
        confianca=0.81,
        prioridade=Prioridade.ALTA,
        estado=EstadoDenuncia.EM_INVESTIGACAO,
        local="Direção de obras públicas, Maputo",
        descricao=(
            "Alegação de que um intermediário próximo de um diretor se ofereceu para garantir "
            "a adjudicação de um contrato de obras mediante uma percentagem do valor."
        ),
        validar=True,
    ),
    dict(
        dias_atras=4,
        categoria=Categoria.CONFLITO_DE_INTERESSES,
        confianca=0.72,
        prioridade=Prioridade.BAIXA,
        estado=EstadoDenuncia.VALIDADA,
        local="Concurso público, Direção provincial, Inhambane",
        descricao=(
            "Um dos membros do júri do concurso é, segundo o denunciante, sócio de uma das "
            "empresas concorrentes, sem que tal tenha sido declarado."
        ),
        validar=True,
    ),
    dict(
        dias_atras=3,
        categoria=Categoria.PECULATO,
        confianca=0.69,
        prioridade=Prioridade.MEDIA,
        estado=EstadoDenuncia.EM_ANALISE,
        local="Instituto público, Maputo",
        descricao=(
            "Suspeita de desvio de verbas destinadas a material escolar, com base em faturas "
            "que não correspondem às quantidades efetivamente entregues às escolas."
        ),
        validar=False,
    ),
    dict(
        dias_atras=35,
        categoria=Categoria.TRAFICO_DE_INFLUENCIA,
        confianca=0.81,
        prioridade=Prioridade.ALTA,
        estado=EstadoDenuncia.EM_INVESTIGACAO,
        local="Tribunal judicial, Xai-Xai",
        descricao=(
            "Um advogado terá insinuado ter contactos dentro do tribunal capazes de acelerar "
            "uma decisão em troca de um pagamento adicional não faturado."
        ),
        validar=True,
    ),
    dict(
        dias_atras=1,
        categoria=Categoria.NEPOTISMO,
        confianca=0.76,
        prioridade=Prioridade.MEDIA,
        estado=EstadoDenuncia.VALIDADA,
        local="Câmara municipal, Quelimane",
        descricao=(
            "Contratação de um familiar direto de um vereador para um cargo técnico sem "
            "concurso público, alegadamente sem cumprir os requisitos mínimos do lugar."
        ),
        validar=True,
    ),
    dict(
        dias_atras=31,
        categoria=Categoria.ABUSO_DE_PODER,
        confianca=0.88,
        prioridade=Prioridade.ALTA,
        estado=EstadoDenuncia.ENCAMINHADA,
        local="Esquadra, Matola",
        descricao=(
            "Denúncia de ameaças a um comerciante para forçar o encerramento de um "
            "estabelecimento concorrente de um negócio ligado a um agente da autoridade."
        ),
        validar=True,
    ),
    dict(
        dias_atras=0,
        categoria=Categoria.FRAUDE,
        confianca=0.84,
        prioridade=Prioridade.CRITICA,
        estado=EstadoDenuncia.EM_ANALISE,
        local="Direção provincial, Sofala",
        descricao=(
            "Suspeita de falsificação de assinaturas em contratos de fornecimento de "
            "combustível, com valores faturados muito acima do consumo real registado."
        ),
        validar=False,
    ),
    dict(
        dias_atras=0,
        categoria=Categoria.PECULATO,
        confianca=0.91,
        prioridade=Prioridade.MEDIA,
        estado=EstadoDenuncia.VALIDADA,
        local="Hospital distrital, Chimoio",
        descricao=(
            "Relato de desaparecimento recorrente de medicamentos do armazém do hospital, "
            "coincidindo com os turnos de um responsável específico do armazém."
        ),
        validar=True,
    ),
    dict(
        dias_atras=0,
        categoria=Categoria.CONFLITO_DE_INTERESSES,
        confianca=0.72,
        prioridade=Prioridade.BAIXA,
        estado=EstadoDenuncia.VALIDADA,
        local="Direção de recursos humanos, Tete",
        descricao=(
            "Um processo de recrutamento interno terá sido conduzido por um responsável cujo "
            "cônjuge era um dos candidatos, sem que se tenha escusado do processo."
        ),
        validar=True,
    ),
    dict(
        dias_atras=0,
        categoria=Categoria.SUBORNO,
        confianca=0.91,
        prioridade=Prioridade.ALTA,
        estado=EstadoDenuncia.PENDENTE_VALIDACAO,
        local="Direção provincial, Maputo",
        descricao=(
            "Pedido de pagamento não previsto para acelerar a emissão de uma licença de "
            "actividade. A entrega em dinheiro foi proposta fora das instalações, sem "
            "qualquer recibo. O atendimento ficou suspenso até ao pagamento."
        ),
        validar=False,
        anonima=True,
    ),
]

_ESTADOS_PARA_ENCAMINHAR = (EstadoDenuncia.ENCAMINHADA, EstadoDenuncia.EM_INVESTIGACAO, EstadoDenuncia.ARQUIVADA)


def _protocolo(indice: int) -> str:
    return f"GCCC-{ANO}-{100 + indice:06d}"


def _criar_utilizadores(db) -> dict[str, User]:
    utilizadores: dict[str, User] = {}
    for spec in _UTILIZADORES:
        existente = db.query(User).filter(User.email == spec["email"]).first()
        if existente is None:
            existente = User(
                name=spec["name"],
                email=spec["email"],
                password_hash=hash_password(DEMO_PASSWORD),
                role=spec["role"],
                ativo=spec.get("ativo", True),
                last_login_at=AGORA - spec["last_login_delta"],
            )
            db.add(existente)
            db.flush()
        utilizadores[spec["email"]] = existente
    return utilizadores


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        utilizadores = _criar_utilizadores(db)
        tecnico = utilizadores[DEMO_EMAIL]
        db.commit()

        if db.query(Denuncia).count() > 0:
            print("Já existem denúncias na base de dados — seed de denúncias ignorado.")
            return

        for indice, item in enumerate(_SEED, start=1):
            criado_em = AGORA - timedelta(days=item["dias_atras"], hours=indice)
            denuncia = Denuncia(
                protocolo=_protocolo(indice),
                anonima=item.get("anonima", False),
                nome_denunciante=None if item.get("anonima") else "Denunciante Fictício",
                local_ocorrencia=item["local"],
                data_ocorrencia=(criado_em - timedelta(days=3)).strftime("%Y-%m-%d"),
                descricao=item["descricao"],
                categoria_llm=item["categoria"],
                confianca_llm=item["confianca"],
                prioridade_llm=item["prioridade"],
                resumo_llm="Resumo automático gerado para fins de demonstração.",
                justificacao_llm="Justificação simulada com base nos indicadores identificados no relato.",
                indicadores_llm=["indicador demonstrativo 1", "indicador demonstrativo 2"],
                llm_modelo="qwen3:4b-instruct",
                estado=item["estado"],
                created_at=criado_em,
                updated_at=criado_em,
            )
            if item["validar"]:
                denuncia.categoria_validada = item["categoria"]
                denuncia.prioridade_validada = item["prioridade"]
                denuncia.observacoes_tecnico = "Classificação confirmada após análise do relato e dos anexos."
                denuncia.tecnico_responsavel_id = tecnico.id
                denuncia.validated_at = criado_em + timedelta(hours=2)
                if item["estado"] in _ESTADOS_PARA_ENCAMINHAR:
                    denuncia.forwarded_at = criado_em + timedelta(hours=3)

            db.add(denuncia)
            db.flush()

            db.add(
                AuditLog(
                    denuncia_id=denuncia.id,
                    tipo=TipoOperacao.CRIACAO,
                    acao="Denúncia criada" + (" (anónima)" if denuncia.anonima else " pelo denunciante"),
                    estado_anterior=None,
                    estado_novo=EstadoDenuncia.RECEBIDA.value,
                    created_at=criado_em,
                )
            )
            db.add(
                AuditLog(
                    denuncia_id=denuncia.id,
                    tipo=TipoOperacao.CLASSIFICACAO_LLM,
                    acao=(
                        f"qwen3:4b sugeriu {item['categoria'].value}, confiança "
                        f"{item['confianca']:.0%}, prioridade {item['prioridade'].value}"
                    ),
                    estado_anterior=EstadoDenuncia.RECEBIDA.value,
                    estado_novo=EstadoDenuncia.PENDENTE_VALIDACAO.value,
                    created_at=criado_em + timedelta(minutes=1),
                )
            )
            if item["estado"] != EstadoDenuncia.PENDENTE_VALIDACAO:
                db.add(
                    AuditLog(
                        denuncia_id=denuncia.id,
                        tipo=TipoOperacao.ALTERACAO_ESTADO,
                        acao=f"{tecnico.name} abriu o processo para revisão",
                        user_id=tecnico.id,
                        estado_anterior=EstadoDenuncia.PENDENTE_VALIDACAO.value,
                        estado_novo=EstadoDenuncia.EM_ANALISE.value,
                        created_at=criado_em + timedelta(hours=1),
                    )
                )
            if item["validar"]:
                db.add(
                    AuditLog(
                        denuncia_id=denuncia.id,
                        tipo=TipoOperacao.VALIDACAO,
                        acao=f"{tecnico.name} validou a denúncia",
                        user_id=tecnico.id,
                        estado_anterior=EstadoDenuncia.EM_ANALISE.value,
                        estado_novo=EstadoDenuncia.VALIDADA.value,
                        created_at=criado_em + timedelta(hours=2),
                    )
                )
            if item["estado"] in _ESTADOS_PARA_ENCAMINHAR:
                db.add(
                    AuditLog(
                        denuncia_id=denuncia.id,
                        tipo=TipoOperacao.ENCAMINHAMENTO,
                        acao=f"{tecnico.name} encaminhou a denúncia para tratamento no GCCC",
                        user_id=tecnico.id,
                        estado_anterior=EstadoDenuncia.VALIDADA.value,
                        estado_novo=EstadoDenuncia.ENCAMINHADA.value,
                        created_at=criado_em + timedelta(hours=3),
                    )
                )
            if item["estado"] in (EstadoDenuncia.EM_INVESTIGACAO, EstadoDenuncia.ARQUIVADA):
                db.add(
                    AuditLog(
                        denuncia_id=denuncia.id,
                        tipo=TipoOperacao.ALTERACAO_ESTADO,
                        acao=f"{tecnico.name} marcou a denúncia como em investigação",
                        user_id=tecnico.id,
                        estado_anterior=EstadoDenuncia.ENCAMINHADA.value,
                        estado_novo=EstadoDenuncia.EM_INVESTIGACAO.value,
                        created_at=criado_em + timedelta(hours=4),
                    )
                )
            if item["estado"] == EstadoDenuncia.ARQUIVADA:
                db.add(
                    AuditLog(
                        denuncia_id=denuncia.id,
                        tipo=TipoOperacao.ALTERACAO_ESTADO,
                        acao=f"{tecnico.name} arquivou a denúncia",
                        user_id=tecnico.id,
                        estado_anterior=EstadoDenuncia.EM_INVESTIGACAO.value,
                        estado_novo=EstadoDenuncia.ARQUIVADA.value,
                        created_at=criado_em + timedelta(hours=5),
                    )
                )

        db.commit()
        print(f"{len(_UTILIZADORES)} utilizadores e {len(_SEED)} denúncias fictícias criadas com sucesso.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
