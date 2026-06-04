"""
Module Reporting — Génération de rapports PDF (cas d'utilisation 'Générer rapport PDF').
Deux rapports :
  - GET /api/reports/ot/<id>.pdf       : fiche d'intervention (un OT)
  - GET /api/reports/dashboard.pdf     : synthèse globale (KPI + parc)
"""
from io import BytesIO
from datetime import datetime
from flask import Blueprint, send_file, abort
from flask_jwt_extended import jwt_required

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, PageBreak)

from ..models import OrdreTravail, Equipement, Piece, Alerte
from .auth import current_user

reports_bp = Blueprint("reports", __name__)


# ---------- Charte graphique (cohérente avec le frontend) ----------
TEAL = colors.HexColor("#0d9488")
TEAL_SOFT = colors.HexColor("#e6f7f5")
INK = colors.HexColor("#1a2330")
INK_SOFT = colors.HexColor("#5d6b7a")
LINE = colors.HexColor("#d6dde4")
RED = colors.HexColor("#dc2626")
GREEN = colors.HexColor("#16a34a")
AMBER = colors.HexColor("#d97706")


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("title", parent=base["Title"], fontName="Helvetica-Bold",
                                fontSize=18, textColor=INK, alignment=0, spaceAfter=4),
        "subtitle": ParagraphStyle("subtitle", parent=base["Normal"], fontSize=10,
                                   textColor=INK_SOFT, spaceAfter=18),
        "h2": ParagraphStyle("h2", parent=base["Heading2"], fontName="Helvetica-Bold",
                             fontSize=11, textColor=TEAL, spaceBefore=14, spaceAfter=8),
        "body": ParagraphStyle("body", parent=base["Normal"], fontSize=10, leading=14, textColor=INK),
        "small": ParagraphStyle("small", parent=base["Normal"], fontSize=8, textColor=INK_SOFT),
    }


def _entete_pied(canvas, doc):
    """En-tête + pied de page sur toutes les pages."""
    canvas.saveState()
    # Bandeau en-tête
    canvas.setFillColor(TEAL)
    canvas.rect(0, A4[1] - 18 * mm, A4[0], 18 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 13)
    canvas.drawString(18 * mm, A4[1] - 11 * mm, "GMAO — Clinique HUPSA")
    canvas.setFont("Helvetica", 9)
    canvas.drawRightString(A4[0] - 18 * mm, A4[1] - 11 * mm,
                           "Gestion de Maintenance Assistée par Ordinateur")
    # Pied
    canvas.setFillColor(INK_SOFT)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(18 * mm, 10 * mm,
                      f"Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}")
    canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def _kv_table(rows, col_widths=None):
    """Construit un tableau étiquette/valeur propre."""
    data = [[Paragraph(f"<b>{k}</b>", _styles()["small"]),
             Paragraph(str(v) if v is not None and v != "" else "—", _styles()["body"])]
            for k, v in rows]
    t = Table(data, colWidths=col_widths or [45 * mm, 110 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINE),
    ]))
    return t


def _badge_text(color):
    """Renvoie un Paragraph teinté pour un statut."""
    return ParagraphStyle("badge", fontSize=10, textColor=color, fontName="Helvetica-Bold")


STATUTS_LBL = {
    "ouvert": ("Ouvert", colors.HexColor("#2563eb")),
    "en_cours": ("En cours", AMBER),
    "attente_pieces": ("En attente pièces", colors.HexColor("#ea580c")),
    "termine": ("Terminé", GREEN),
    "annule": ("Annulé", colors.HexColor("#64748b")),
}
PRIORITES_LBL = {
    "basse": ("Basse", colors.HexColor("#64748b")),
    "normale": ("Normale", colors.HexColor("#2563eb")),
    "haute": ("Haute", colors.HexColor("#ea580c")),
    "critique": ("Critique", RED),
}


# ====================================================================
# RAPPORT 1 — Fiche d'intervention (un ordre de travail)
# ====================================================================
@reports_bp.get("/ot/<int:oid>.pdf")
@jwt_required()
def rapport_ot(oid):
    user = current_user()
    o = OrdreTravail.query.get_or_404(oid)
    if user.role == "major" and (not o.equipement or o.equipement.service != user.service):
        abort(403)

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=18 * mm, rightMargin=18 * mm,
                            topMargin=28 * mm, bottomMargin=18 * mm)
    s = _styles()
    story = []

    story.append(Paragraph("Fiche d'intervention", s["title"]))
    statut_lbl, statut_col = STATUTS_LBL.get(o.statut, (o.statut, INK))
    prio_lbl, prio_col = PRIORITES_LBL.get(o.priorite, (o.priorite, INK))
    story.append(Paragraph(
        f'<font color="{INK_SOFT}">{o.numero}</font> · '
        f'<font color="{statut_col}"><b>{statut_lbl}</b></font> · '
        f'<font color="{prio_col}">Priorité {prio_lbl.lower()}</font>',
        s["subtitle"]))

    # Bandeau titre OT
    box = Table([[Paragraph(f"<b>{o.titre}</b>", s["body"])]], colWidths=[doc.width])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), TEAL_SOFT),
        ("BOX", (0, 0), (-1, -1), 0.5, TEAL),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story += [box, Spacer(1, 14)]

    # Identification
    story.append(Paragraph("Identification", s["h2"]))
    story.append(_kv_table([
        ("Numéro OT", o.numero),
        ("Type", "Préventive" if o.type_ot == "preventive" else "Corrective"),
        ("Date de création",
         o.date_creation.strftime("%d/%m/%Y %H:%M") if o.date_creation else "—"),
        ("Créé par",
         f"{o.createur.prenom} {o.createur.nom}" if o.createur else "—"),
    ]))

    # Équipement
    if o.equipement:
        e = o.equipement
        story.append(Paragraph("Équipement concerné", s["h2"]))
        story.append(_kv_table([
            ("Désignation", e.nom),
            ("Marque / Modèle", f"{e.marque or '—'} · {e.modele or '—'}"),
            ("Codification", e.numero_serie),
            ("N° série fabricant", e.numero_serie_fabricant),
            ("Service", e.service),
            ("Localisation", " · ".join(p for p in [e.etage, e.description_local] if p) or e.localisation),
        ]))

    # Intervention
    story.append(Paragraph("Intervention", s["h2"]))
    duree = f"{o.duree_minutes // 60}h {o.duree_minutes % 60:02d}min" if o.duree_minutes else "—"
    story.append(_kv_table([
        ("Technicien assigné",
         f"{o.technicien.prenom} {o.technicien.nom}" if o.technicien else "Non assigné"),
        ("Début", o.date_debut.strftime("%d/%m/%Y %H:%M") if o.date_debut else "—"),
        ("Fin", o.date_fin.strftime("%d/%m/%Y %H:%M") if o.date_fin else "—"),
        ("Durée totale", duree),
    ]))

    # Pièces consommées
    pieces = o.pieces_utilisees or []
    if pieces:
        story.append(Paragraph("Pièces consommées", s["h2"]))
        data = [["Référence", "Désignation", "Qté", "Prix unitaire", "Total"]]
        total_pieces = 0
        for p in pieces:
            ligne = p.quantite_utilisee * p.prix_unitaire
            total_pieces += ligne
            data.append([
                p.piece.reference if p.piece else "—",
                p.piece.designation if p.piece else "—",
                str(p.quantite_utilisee),
                f"{p.prix_unitaire:.2f} DH",
                f"{ligne:.2f} DH",
            ])
        data.append(["", "", "", "Sous-total pièces", f"{total_pieces:.2f} DH"])
        t = Table(data, colWidths=[28*mm, 60*mm, 15*mm, 28*mm, 30*mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), TEAL),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -2), 0.3, LINE),
            ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
            ("FONTNAME", (3, -1), (-1, -1), "Helvetica-Bold"),
            ("LINEABOVE", (0, -1), (-1, -1), 0.7, INK),
        ]))
        story.append(t)

    # Coûts
    story.append(Paragraph("Synthèse financière", s["h2"]))
    cout_pieces = sum(p.quantite_utilisee * p.prix_unitaire for p in pieces)
    cout_total = (o.cout_main_oeuvre or 0) + cout_pieces
    cout_data = [
        ["Main d'œuvre", f"{o.cout_main_oeuvre or 0:.2f} DH"],
        ["Pièces", f"{cout_pieces:.2f} DH"],
        ["Coût total", f"{cout_total:.2f} DH"],
    ]
    t = Table(cout_data, colWidths=[120*mm, 40*mm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, LINE),
        ("LINEABOVE", (0, -1), (-1, -1), 0.7, INK),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, -1), (-1, -1), TEAL),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)

    # Observations
    if o.observations:
        story.append(Paragraph("Observations du technicien", s["h2"]))
        box = Table([[Paragraph(o.observations.replace("\n", "<br/>"), s["body"])]],
                    colWidths=[doc.width])
        box.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]))
        story.append(box)

    # Signatures
    story.append(Spacer(1, 24))
    sig = Table([
        [Paragraph("Technicien", s["small"]), "", Paragraph("Responsable", s["small"])],
        ["", "", ""],
        ["", "", ""],
        [Paragraph("_______________________", s["small"]), "",
         Paragraph("_______________________", s["small"])],
    ], colWidths=[70*mm, 20*mm, 70*mm])
    sig.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "BOTTOM")]))
    story.append(sig)

    doc.build(story, onFirstPage=_entete_pied, onLaterPages=_entete_pied)
    buf.seek(0)
    return send_file(buf, mimetype="application/pdf",
                     as_attachment=True, download_name=f"{o.numero}.pdf")


# ====================================================================
# RAPPORT 2 — Synthèse globale
# ====================================================================
@reports_bp.get("/dashboard.pdf")
@jwt_required()
def rapport_dashboard():
    user = current_user()
    eq_q = Equipement.query
    ot_q = OrdreTravail.query
    if user.role == "major" and user.service:
        eq_q = eq_q.filter_by(service=user.service)
        ot_q = ot_q.join(Equipement).filter(Equipement.service == user.service)
    equipements = eq_q.all()
    ordres = ot_q.all()
    pieces = [] if user.role == "major" else Piece.query.all()
    alertes_non_lues = Alerte.query.filter_by(lue=False).count()

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=18*mm, rightMargin=18*mm,
                            topMargin=28*mm, bottomMargin=18*mm)
    s = _styles()
    story = []

    scope = user.service if user.role == "major" else "Vue globale"
    story.append(Paragraph("Rapport de synthèse", s["title"]))
    story.append(Paragraph(
        f"Périmètre : <b>{scope}</b> · Établi par {user.prenom} {user.nom} ({user.role})",
        s["subtitle"]))

    # KPI grid
    story.append(Paragraph("Indicateurs clés", s["h2"]))
    op = sum(1 for e in equipements if e.statut == "operationnel")
    dispo = round(op / max(1, len(equipements)) * 100)
    ot_actifs = sum(1 for o in ordres if o.statut in ("ouvert", "en_cours", "attente_pieces"))
    stock_bas = sum(1 for p in pieces if p.stock_bas())

    kpi = Table([
        [Paragraph(f"<font size=20><b>{len(equipements)}</b></font><br/>"
                   f"<font size=8 color='{INK_SOFT}'>équipements</font>", s["body"]),
         Paragraph(f"<font size=20><b>{dispo}%</b></font><br/>"
                   f"<font size=8 color='{INK_SOFT}'>disponibilité</font>", s["body"]),
         Paragraph(f"<font size=20><b>{ot_actifs}</b></font><br/>"
                   f"<font size=8 color='{INK_SOFT}'>OT actifs</font>", s["body"]),
         Paragraph(f"<font size=20><b>{stock_bas if pieces else '—'}</b></font><br/>"
                   f"<font size=8 color='{INK_SOFT}'>pièces sous seuil</font>", s["body"])],
    ], colWidths=[doc.width/4]*4)
    kpi.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BACKGROUND", (0, 0), (-1, -1), TEAL_SOFT),
        ("BOX", (0, 0), (-1, -1), 0.4, TEAL),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, TEAL),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
    ]))
    story.append(kpi)

    # Répartition OT
    story.append(Paragraph("Répartition des ordres de travail", s["h2"]))
    data = [["Statut", "Nombre", "Part"]]
    total_ot = max(1, len(ordres))
    for k, (lbl, _) in STATUTS_LBL.items():
        n = sum(1 for o in ordres if o.statut == k)
        data.append([lbl, str(n), f"{round(n/total_ot*100)}%"])
    data.append(["Total", str(len(ordres)), "100%"])
    t = Table(data, colWidths=[80*mm, 40*mm, 30*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -2), 0.3, LINE),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("LINEABOVE", (0, -1), (-1, -1), 0.7, INK),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ]))
    story.append(t)

    # État du parc
    story.append(Paragraph("État du parc d'équipements", s["h2"]))
    eq_lbl = {"operationnel": ("Opérationnel", GREEN), "en_panne": ("En panne", RED),
              "maintenance": ("En maintenance", AMBER), "reforme": ("Réformé", colors.HexColor("#64748b"))}
    data = [["Statut", "Nombre", "Part"]]
    total_eq = max(1, len(equipements))
    for k, (lbl, _) in eq_lbl.items():
        n = sum(1 for e in equipements if e.statut == k)
        data.append([lbl, str(n), f"{round(n/total_eq*100)}%"])
    data.append(["Total", str(len(equipements)), "100%"])
    t = Table(data, colWidths=[80*mm, 40*mm, 30*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -2), 0.3, LINE),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("LINEABOVE", (0, -1), (-1, -1), 0.7, INK),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ]))
    story.append(t)

    # Alertes (admin/resp seulement)
    if user.role != "major" and alertes_non_lues > 0:
        story.append(Paragraph("Alertes en cours", s["h2"]))
        story.append(Paragraph(
            f"<b>{alertes_non_lues}</b> alerte(s) non lue(s) nécessitent une attention.",
            s["body"]))

    doc.build(story, onFirstPage=_entete_pied, onLaterPages=_entete_pied)
    buf.seek(0)
    fname = f"rapport_gmao_{datetime.now().strftime('%Y%m%d')}.pdf"
    return send_file(buf, mimetype="application/pdf",
                     as_attachment=True, download_name=fname)
