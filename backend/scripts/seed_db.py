"""Popula a base de dados com denúncias fictícias para demonstração.

As denúncias e entidades aqui descritas são inteiramente fictícias, criadas
apenas para demonstrar o dashboard, os filtros e o fluxo de validação do
protótipo. Não correspondem a factos reais nem identificam pessoas reais.

Uso:
    python scripts/seed_db.py
"""

import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models.denuncia import Categoria, Denuncia, EstadoDenuncia, Prioridade  # noqa: E402
from app.models.audit_log import AuditLog  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402
from app.utils.security import hash_password  # noqa: E402

DEMO_EMAIL = "tecnico@gccc.gov.mz"
DEMO_PASSWORD = "Admin123!"

AGORA = datetime.utcnow()
ANO = AGORA.year

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
        dias_atras=2,
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
        dias_atras=1,
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


def _protocolo(indice: int) -> str:
    return f"GCCC-{ANO}-{100 + indice:06d}"


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        tecnico = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if tecnico is None:
            tecnico = User(
                name="Técnico GCCC",
                email=DEMO_EMAIL,
                password_hash=hash_password(DEMO_PASSWORD),
                role=UserRole.TECNICO,
            )
            db.add(tecnico)
            db.flush()

        if db.query(Denuncia).count() > 0:
            print("Já existem denúncias na base de dados — seed ignorado.")
            return

        for indice, item in enumerate(_SEED, start=1):
            criado_em = AGORA - timedelta(days=item["dias_atras"], hours=indice)
            denuncia = Denuncia(
                protocolo=_protocolo(indice),
                anonima=item.get("anonima", False),
                nome_denunciante=None if item.get("anonima") else "Denunciante Fictício",
                local_ocorrencia=item["local"],
                data_ocorrencia=(criado_em - timedelta(days=3)).strftime("%Y-%m-%d"),
                descricao=item["descricao"] if isinstance(item["descricao"], str) else item["descricao"][0],
                categoria_llm=item["categoria"],
                confianca_llm=item["confianca"],
                prioridade_llm=item["prioridade"],
                resumo_llm="Resumo automático gerado para fins de demonstração.",
                justificacao_llm="Justificação simulada com base nos indicadores identificados no relato.",
                indicadores_llm=["indicador demonstrativo 1", "indicador demonstrativo 2"],
                llm_modelo="seed-fixture",
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
                if item["estado"] in (EstadoDenuncia.ENCAMINHADA, EstadoDenuncia.EM_INVESTIGACAO, EstadoDenuncia.ARQUIVADA):
                    denuncia.forwarded_at = criado_em + timedelta(hours=3)

            db.add(denuncia)
            db.flush()

            db.add(
                AuditLog(
                    denuncia_id=denuncia.id,
                    acao="Denúncia criada",
                    estado_anterior=None,
                    estado_novo=EstadoDenuncia.RECEBIDA.value,
                    created_at=criado_em,
                )
            )
            db.add(
                AuditLog(
                    denuncia_id=denuncia.id,
                    acao=f"Classificação preliminar: {item['categoria'].value} ({item['confianca']:.0%})",
                    estado_anterior=EstadoDenuncia.RECEBIDA.value,
                    estado_novo=EstadoDenuncia.PENDENTE_VALIDACAO.value,
                    created_at=criado_em + timedelta(minutes=1),
                )
            )
            if item["estado"] != EstadoDenuncia.PENDENTE_VALIDACAO:
                db.add(
                    AuditLog(
                        denuncia_id=denuncia.id,
                        acao="Processo aberto para revisão",
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
                        acao="Denúncia validada",
                        user_id=tecnico.id,
                        estado_anterior=EstadoDenuncia.EM_ANALISE.value,
                        estado_novo=EstadoDenuncia.VALIDADA.value,
                        created_at=criado_em + timedelta(hours=2),
                    )
                )
            if item["estado"] in (EstadoDenuncia.ENCAMINHADA, EstadoDenuncia.EM_INVESTIGACAO, EstadoDenuncia.ARQUIVADA):
                db.add(
                    AuditLog(
                        denuncia_id=denuncia.id,
                        acao="Denúncia encaminhada para a entidade competente",
                        user_id=tecnico.id,
                        estado_anterior=EstadoDenuncia.VALIDADA.value,
                        estado_novo=EstadoDenuncia.ENCAMINHADA.value,
                        created_at=criado_em + timedelta(hours=3),
                    )
                )

        db.commit()
        print(f"{len(_SEED)} denúncias fictícias criadas com sucesso.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
