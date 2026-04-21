import React, { useState, useMemo } from "react";
import {
  Coins,
  Send,
  Scroll,
  FileSignature,
  ArrowUpRight,
  ArrowDownLeft,
  Handshake,
  ShieldAlert,
  Wallet,
  Stamp,
  PenTool,
  Calendar,
  Percent,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Landmark,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronDown,
  Receipt,
  PiggyBank,
  Scale,
  Filter,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  Section,
  SectionGroup,
  Toolbar,
  Button,
  IconButton,
  Input,
  Select,
  Textarea,
  NumberInput,
  SearchField,
  FormGrid,
  FormRow,
  Tabs,
  StatTile,
  StatusBadge,
  MoneyAmount,
  DateTag,
  DataList,
  EmptyState,
  UserSearchSelect,
  useConfirm,
  TRANSACTION_LABELS,
  TRANSACTION_COLORS,
} from "../ui";

const CitizenBankView = ({
  user,
  users,
  companies = [],
  countries = [],
  globalLedger,
  debtRegistry,
  onTransfer,
  onProposeDebt,
  onSignDebt,
  onPayDebt,
  onCancelDebt,
  canUseBank,
  isBanned,
}) => {
  const [activeTab, setActiveTab] = useState("operations");
  const { confirm, dialog: confirmDialog } = useConfirm();

  // ÉTATS
  const [transferTargetType, setTransferTargetType] = useState("CITIZEN");
  const [transferTarget, setTransferTarget] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [showBalance, setShowBalance] = useState(true);

  const [loanTarget, setLoanTarget] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanInterest, setLoanInterest] = useState("0");
  const [loanDueDate, setLoanDueDate] = useState("");
  const [loanReason, setLoanReason] = useState("");

  const [historyFilter, setHistoryFilter] = useState("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [contractFilter, setContractFilter] = useState("ALL");

  const safeCompanies = Array.isArray(companies) ? companies : [];
  const safeCountries = Array.isArray(countries) ? countries : [];
  const safeRegistry = Array.isArray(debtRegistry) ? debtRegistry : [];

  // CALCULS
  const myTransactions = useMemo(
    () =>
      (globalLedger || [])
        .filter((l) => l.fromName === user.name || l.toName === user.name)
        .sort((a, b) => (b.timestamp || b.id) - (a.timestamp || a.id)),
    [globalLedger, user.name]
  );

  const filteredTransactions = useMemo(() => {
    let txs = myTransactions;
    if (historyFilter !== "ALL") {
      if (historyFilter === "IN") txs = txs.filter((t) => t.toName === user.name);
      else if (historyFilter === "OUT") txs = txs.filter((t) => t.fromName === user.name);
      else txs = txs.filter((t) => t.type === historyFilter);
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      txs = txs.filter(
        (t) =>
          (t.fromName || "").toLowerCase().includes(q) ||
          (t.toName || "").toLowerCase().includes(q) ||
          (t.reason || "").toLowerCase().includes(q)
      );
    }
    return txs;
  }, [myTransactions, historyFilter, historySearch, user.name]);

  const displayedTransactions = showAllHistory
    ? filteredTransactions
    : filteredTransactions.slice(0, 20);

  const myDebts = safeRegistry.filter((d) => d.debtorId === user.id && d.status === "ACTIVE");
  const myCredits = safeRegistry.filter((d) => d.creditorId === user.id && d.status === "ACTIVE");
  const pendingSignatures = safeRegistry.filter((d) => d.debtorId === user.id && d.status === "DRAFT");
  const myProposals = safeRegistry.filter((d) => d.creditorId === user.id && d.status === "DRAFT");
  const allMyContracts = safeRegistry.filter(
    (d) => d.debtorId === user.id || d.creditorId === user.id
  );

  const filteredContracts = useMemo(() => {
    if (contractFilter === "ALL") return allMyContracts;
    return allMyContracts.filter((d) => d.status === contractFilter);
  }, [allMyContracts, contractFilter]);

  const totalReceived = myTransactions
    .filter((t) => t.toName === user.name)
    .reduce((s, t) => s + (t.amount || 0), 0);
  const totalSent = myTransactions
    .filter((t) => t.fromName === user.name)
    .reduce((s, t) => s + (t.amount || 0), 0);
  const totalDebtOwed = myDebts.reduce((s, d) => s + (d.totalAmount || 0), 0);
  const totalCreditDue = myCredits.reduce((s, d) => s + (d.totalAmount || 0), 0);

  // ACTIONS
  const handleTransfer = () => {
    if (!transferTarget || !transferAmount || parseFloat(transferAmount) <= 0) return;
    const tgtRaw =
      transferTargetType === "COMPANY"
        ? `E-${transferTarget}`
        : transferTargetType === "COUNTRY"
        ? `C-${transferTarget}`
        : `U-${transferTarget}`;
    onTransfer(`U-${user.id}`, tgtRaw, parseFloat(transferAmount));
    setTransferAmount("");
    setTransferTarget("");
    setTransferReason("");
  };

  const handleProposeLoan = () => {
    if (!loanTarget || !loanAmount || parseFloat(loanAmount) <= 0) return;
    if (onProposeDebt) {
      onProposeDebt(
        loanTarget,
        parseFloat(loanAmount),
        parseFloat(loanInterest) || 0,
        loanReason || "Prêt",
        loanDueDate || "Indéterminée"
      );
    }
    setLoanTarget("");
    setLoanAmount("");
    setLoanReason("");
    setLoanInterest("0");
    setLoanDueDate("");
  };

  const askPayDebt = async (debt) => {
    const ok = await confirm({
      title: "Rembourser la dette ?",
      message: `Confirmer le remboursement de ${debt.totalAmount} Écus à ${debt.creditorName} ?`,
      confirmLabel: "Rembourser",
    });
    if (ok) onPayDebt(debt.id);
  };

  const askGracePardon = async (credit) => {
    const ok = await confirm({
      title: "Faire grâce de cette dette ?",
      message: "Le débiteur n'aura plus rien à payer. Cette action est irréversible.",
      confirmLabel: "Faire grâce",
      danger: true,
    });
    if (ok) onCancelDebt(credit.id);
  };

  if (!canUseBank || isBanned) {
    return (
      <PageContainer>
        <EmptyState
          icon={ShieldAlert}
          title="Accès Bancaire Interdit"
          description="Vos droits économiques ont été révoqués."
          size="lg"
        />
      </PageContainer>
    );
  }

  const pendingCount = pendingSignatures.length;
  const tabs = [
    { id: "operations", label: "Opérations", icon: Wallet },
    { id: "loans", label: "Contrats", icon: FileSignature, badge: pendingCount },
    { id: "history", label: "Historique", icon: Scroll },
  ];

  // ─── HERO (solde + onglets) ──────────────────────────────────────────
  const hero = (
    <Section variant="dark" padded={false} className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 36px)",
          }}
        />
      </div>
      <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-imperial-600/20 rounded-lg">
              <PiggyBank size={20} className="text-imperial-400" />
            </div>
            <div className="text-eyebrow text-imperial-400/90">
              Avoirs Personnels
            </div>
            <IconButton
              icon={showBalance ? Eye : EyeOff}
              aria-label={showBalance ? "Masquer le solde" : "Afficher le solde"}
              onClick={() => setShowBalance(!showBalance)}
              variant="ghost"
              size="sm"
            />
          </div>
          <div className="font-display text-5xl md:text-6xl font-bold text-imperial-400 tracking-tighter">
            {showBalance ? (
              <MoneyAmount value={user?.balance || 0} size="lg" className="text-5xl md:text-6xl text-imperial-400" />
            ) : (
              <span className="text-imperial-400/40">••••••</span>
            )}
          </div>
          {showBalance && (
            <div className="flex items-center gap-4 mt-3 text-[10px] text-imperial-400/70">
              <span className="flex items-center gap-1">
                <TrendingUp size={10} className="text-green-400" />
                Reçu : <MoneyAmount value={totalReceived} short tone="positive" size="sm" />
              </span>
              <span className="flex items-center gap-1">
                <TrendingDown size={10} className="text-red-400" />
                Envoyé : <MoneyAmount value={totalSent} short tone="negative" size="sm" />
              </span>
            </div>
          )}
        </div>
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} variant="pills" />
        <Coins
          size={140}
          className="absolute -right-8 -bottom-10 opacity-[0.06] text-imperial-50 pointer-events-none"
        />
      </div>
    </Section>
  );

  // ─── STATS RAPIDES ──────────────────────────────────────────────────
  const stats = (
    <SectionGroup cols={4} gap={3}>
      <StatTile
        icon={Receipt}
        label="Transactions"
        value={myTransactions.length}
        accent="bg-blue-50 text-blue-600"
        sub={`${myTransactions.filter((t) => t.toName === user.name).length} reçues`}
      />
      <StatTile
        icon={FileSignature}
        label="Contrats"
        value={allMyContracts.length}
        accent="bg-purple-50 text-purple-600"
        sub={`${myDebts.length + myCredits.length} actifs`}
      />
      <StatTile
        icon={TrendingDown}
        label="Passif"
        value={<MoneyAmount value={totalDebtOwed} short bold={false} />}
        accent="bg-red-50 text-red-600"
        sub={`${myDebts.length} dette${myDebts.length !== 1 ? "s" : ""}`}
      />
      <StatTile
        icon={TrendingUp}
        label="Actif"
        value={<MoneyAmount value={totalCreditDue} short bold={false} />}
        accent="bg-green-50 text-green-600"
        sub={`${myCredits.length} créance${myCredits.length !== 1 ? "s" : ""}`}
      />
    </SectionGroup>
  );

  // ─── ONGLET : OPÉRATIONS ────────────────────────────────────────────
  const operationsTab = (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2">
        <Section title="Ordre de Virement" icon={Send}>
          <div className="space-y-4">
            <div>
              <div className="text-eyebrow mb-1.5">Type de bénéficiaire</div>
              <div className="flex gap-2">
                <Button
                  variant={transferTargetType === "CITIZEN" ? "primary" : "secondary"}
                  size="sm"
                  icon={CreditCard}
                  fullWidth
                  onClick={() => {
                    setTransferTargetType("CITIZEN");
                    setTransferTarget("");
                  }}
                >
                  Citoyen
                </Button>
                {safeCompanies.length > 0 && (
                  <Button
                    variant={transferTargetType === "COMPANY" ? "primary" : "secondary"}
                    size="sm"
                    icon={Banknote}
                    fullWidth
                    onClick={() => {
                      setTransferTargetType("COMPANY");
                      setTransferTarget(safeCompanies[0]?.id || "");
                    }}
                  >
                    Entreprise
                  </Button>
                )}
                {safeCountries.length > 0 && (
                  <Button
                    variant={transferTargetType === "COUNTRY" ? "primary" : "secondary"}
                    size="sm"
                    icon={Landmark}
                    fullWidth
                    onClick={() => {
                      setTransferTargetType("COUNTRY");
                      setTransferTarget(safeCountries[0]?.id || "");
                    }}
                  >
                    Pays
                  </Button>
                )}
              </div>
            </div>

            <div>
              <div className="text-eyebrow mb-1.5">Bénéficiaire</div>
              {transferTargetType === "CITIZEN" ? (
                <UserSearchSelect
                  users={users}
                  onSelect={setTransferTarget}
                  placeholder="Rechercher un citoyen…"
                  excludeIds={[user.id]}
                  value={transferTarget}
                />
              ) : transferTargetType === "COMPANY" ? (
                <Select
                  placeholder="— Choisir une entreprise —"
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  options={safeCompanies.map((c) => ({ value: c.id, label: c.name }))}
                />
              ) : (
                <Select
                  placeholder="— Choisir un pays —"
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  options={safeCountries.map((c) => ({ value: c.id, label: c.name }))}
                />
              )}
            </div>

            <NumberInput
              label="Montant"
              suffix="Écus"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0"
              error={
                transferAmount && parseFloat(transferAmount) > (user?.balance || 0)
                  ? "Fonds insuffisants"
                  : undefined
              }
            />

            <Input
              label="Motif"
              helper="Optionnel"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Raison du transfert…"
            />

            {transferTarget && transferAmount && (
              <Section variant="sunken" padded>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-ink-soft">Montant à envoyer</span>
                  <MoneyAmount value={parseFloat(transferAmount || 0)} size="sm" />
                </div>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-ink-soft">Solde après transfert</span>
                  <MoneyAmount
                    value={(user?.balance || 0) - parseFloat(transferAmount || 0)}
                    size="sm"
                    tone={
                      (user?.balance || 0) - parseFloat(transferAmount || 0) < 0
                        ? "negative"
                        : "positive"
                    }
                  />
                </div>
              </Section>
            )}

            <Button
              variant="primary"
              size="lg"
              icon={Send}
              fullWidth
              onClick={handleTransfer}
              disabled={
                !transferTarget ||
                !transferAmount ||
                parseFloat(transferAmount) <= 0 ||
                parseFloat(transferAmount) > (user?.balance || 0)
              }
            >
              Exécuter le Transfert
            </Button>
          </div>
        </Section>
      </div>

      <div className="lg:col-span-3">
        <Section
          title="Derniers Mouvements"
          icon={Scroll}
          padded={false}
          actions={
            <Button variant="link" size="sm" onClick={() => setActiveTab("history")}>
              Voir tout →
            </Button>
          }
        >
          <DataList
            items={myTransactions.slice(0, 15)}
            getKey={(tx) => tx.id}
            maxHeight="max-h-[520px]"
            empty={<EmptyState icon={Receipt} title="Aucun mouvement" />}
            renderRow={(tx) => {
              const isIncoming = tx.toName === user.name;
              return (
                <div className="flex justify-between items-center px-4 py-3 hover:bg-surface-hover transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isIncoming
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {isIncoming ? (
                        <ArrowDownLeft size={16} />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-ink text-sm truncate">
                        {isIncoming ? `De ${tx.fromName}` : `Vers ${tx.toName}`}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {tx.type && (
                          <span
                            className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                              TRANSACTION_COLORS[tx.type] ||
                              "bg-stone-50 text-stone-500 border-stone-100"
                            }`}
                          >
                            {TRANSACTION_LABELS[tx.type] || tx.type}
                          </span>
                        )}
                        <DateTag timestamp={tx.timestamp} />
                      </div>
                    </div>
                  </div>
                  <MoneyAmount
                    value={tx.amount}
                    signed={isIncoming ? "+" : "−"}
                    tone={isIncoming ? "positive" : "negative"}
                    className="ml-3"
                  />
                </div>
              );
            }}
          />
        </Section>
      </div>
    </div>
  );

  // ─── ONGLET : CONTRATS ──────────────────────────────────────────────
  const loansTab = (
    <div className="space-y-6">
      {pendingSignatures.length > 0 && (
        <Section
          title={`Signature Requise (${pendingSignatures.length})`}
          icon={AlertTriangle}
          variant="highlighted"
          headerAccent="text-imperial-700"
        >
          <SectionGroup cols={2} gap={4}>
            {pendingSignatures.map((contract) => (
              <Section key={contract.id} variant="default" padded>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-eyebrow">Créancier</div>
                    <div className="font-black text-ink text-base">
                      {contract.creditorName}
                    </div>
                  </div>
                  <StatusBadge status="DRAFT" />
                </div>

                <Section variant="sunken" padded className="mb-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-eyebrow">Prêt</div>
                      <MoneyAmount value={contract.principal || 0} short size="sm" />
                    </div>
                    <div>
                      <div className="text-eyebrow">Intérêts</div>
                      <div className="font-black text-imperial-700 text-sm text-numeric">
                        {contract.interestRate || 0}%
                      </div>
                    </div>
                    <div>
                      <div className="text-eyebrow">Total dû</div>
                      <MoneyAmount
                        value={contract.totalAmount || 0}
                        short
                        tone="negative"
                        size="sm"
                      />
                    </div>
                  </div>
                </Section>

                {contract.dueDate && (
                  <div className="mb-3">
                    <DateTag text={`Échéance : ${contract.dueDate}`} />
                  </div>
                )}
                {contract.reason && (
                  <Section variant="sunken" padded className="mb-4">
                    <p className="text-[11px] text-ink-soft italic">
                      « {contract.reason} »
                    </p>
                  </Section>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    icon={Stamp}
                    fullWidth
                    onClick={() => onSignDebt(contract.id)}
                  >
                    Accepter & Signer
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => onCancelDebt(contract.id)}
                  >
                    Refuser
                  </Button>
                </div>
              </Section>
            ))}
          </SectionGroup>
        </Section>
      )}

      {myProposals.length > 0 && (
        <Section
          title={`Mes Propositions en Attente (${myProposals.length})`}
          icon={Clock}
          variant="sunken"
        >
          <SectionGroup cols={3} gap={3}>
            {myProposals.map((contract) => (
              <Section key={contract.id} padded>
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-eyebrow">Proposé à</div>
                    <div className="font-bold text-ink text-sm truncate">
                      {contract.debtorName}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <MoneyAmount value={contract.principal || 0} short size="sm" />
                      <span className="text-ink-mute text-[10px]">→</span>
                      <MoneyAmount
                        value={contract.totalAmount || 0}
                        short
                        tone="muted"
                        size="sm"
                      />
                    </div>
                  </div>
                  <IconButton
                    icon={XCircle}
                    aria-label="Annuler la proposition"
                    variant="danger"
                    onClick={() => onCancelDebt(contract.id)}
                  />
                </div>
              </Section>
            ))}
          </SectionGroup>
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Rédiger un Contrat" icon={PenTool}>
          <FormGrid cols={2} gap={3}>
            <FormRow span={2}>
              <div>
                <div className="text-eyebrow mb-1.5">Bénéficiaire (Débiteur)</div>
                <UserSearchSelect
                  users={users}
                  onSelect={setLoanTarget}
                  excludeIds={[user.id]}
                  value={loanTarget}
                  placeholder="Choisir un citoyen…"
                />
              </div>
            </FormRow>
            <FormRow>
              <NumberInput
                label="Somme Prêtée"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                rightIcon={Coins}
                placeholder="0"
              />
            </FormRow>
            <FormRow>
              <NumberInput
                label="Intérêts"
                value={loanInterest}
                onChange={(e) => setLoanInterest(e.target.value)}
                rightIcon={Percent}
                step="1"
              />
            </FormRow>
            <FormRow span={2}>
              <Input
                label="Échéance"
                value={loanDueDate}
                onChange={(e) => setLoanDueDate(e.target.value)}
                rightIcon={Calendar}
                placeholder="Ex : Fin du Cycle…"
              />
            </FormRow>
            <FormRow span={2}>
              <Textarea
                label="Motif / Conditions"
                value={loanReason}
                onChange={(e) => setLoanReason(e.target.value)}
                rows={2}
                placeholder="Ex : Financement expédition commerciale…"
              />
            </FormRow>
          </FormGrid>

          <Section variant="highlighted" padded className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-eyebrow text-imperial-800">
                Récapitulatif du contrat
              </span>
              <Scale size={14} className="text-imperial-600" />
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-imperial-700">Principal</span>
                <MoneyAmount value={parseFloat(loanAmount) || 0} short size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-imperial-700">Intérêts</span>
                <MoneyAmount
                  value={
                    loanAmount && loanInterest
                      ? Math.floor((parseFloat(loanAmount) * parseFloat(loanInterest)) / 100)
                      : 0
                  }
                  short
                  signed="+"
                  tone="imperial"
                  size="sm"
                />
              </div>
              <div className="border-t border-imperial-200 pt-1.5 flex justify-between">
                <span className="font-bold text-imperial-800">Total à rembourser</span>
                <MoneyAmount
                  value={
                    loanAmount
                      ? Math.floor(parseFloat(loanAmount) * (1 + parseFloat(loanInterest || 0) / 100))
                      : 0
                  }
                  tone="negative"
                />
              </div>
            </div>
          </Section>

          <Button
            variant="primary"
            size="lg"
            icon={FileSignature}
            fullWidth
            className="mt-4"
            onClick={handleProposeLoan}
            disabled={!loanTarget || !loanAmount}
          >
            Proposer le contrat
          </Button>
        </Section>

        <div className="space-y-6">
          <Section
            title="Mes Dettes"
            icon={ArrowUpRight}
            headerAccent="text-red-700"
            padded={false}
          >
            <div className="p-4 space-y-3">
              {myDebts.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Libre de toute dette"
                  size="sm"
                />
              ) : (
                myDebts.map((d) => (
                  <Section
                    key={d.id}
                    padded
                    variant="default"
                    className="border-l-4 border-l-red-500"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-eyebrow">Créancier</div>
                        <div className="font-black text-ink text-base">
                          {d.creditorName}
                        </div>
                        {d.dueDate && (
                          <DateTag text={d.dueDate} className="mt-1" />
                        )}
                      </div>
                      <div className="text-right">
                        <MoneyAmount value={d.totalAmount || 0} tone="negative" />
                        <div className="mt-1">
                          <StatusBadge status="ACTIVE" />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      icon={Coins}
                      fullWidth
                      onClick={() => askPayDebt(d)}
                    >
                      Rembourser
                    </Button>
                  </Section>
                ))
              )}
            </div>
          </Section>

          <Section
            title="Mes Créances"
            icon={Handshake}
            headerAccent="text-green-700"
            padded={false}
          >
            <div className="p-4 space-y-3">
              {myCredits.length === 0 ? (
                <EmptyState icon={Handshake} title="Aucune créance" size="sm" />
              ) : (
                myCredits.map((c) => (
                  <Section
                    key={c.id}
                    padded
                    variant="default"
                    className="border-l-4 border-l-green-500"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-eyebrow">Débiteur</div>
                        <div className="font-black text-ink text-base">
                          {c.debtorName}
                        </div>
                        {c.reason && (
                          <div className="text-[10px] text-ink-mute mt-1 italic">
                            « {c.reason} »
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <MoneyAmount value={c.totalAmount || 0} tone="positive" />
                        <div className="mt-1">
                          <StatusBadge status="ACTIVE" />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="subtle"
                      icon={Handshake}
                      fullWidth
                      onClick={() => askGracePardon(c)}
                    >
                      Faire Grâce
                    </Button>
                  </Section>
                ))
              )}
            </div>
          </Section>
        </div>
      </div>

      {allMyContracts.length > 0 && (
        <Section
          title="Registre des Contrats"
          icon={FileSignature}
          padded={false}
          actions={
            <div className="flex gap-1">
              {["ALL", "ACTIVE", "PAID", "CANCELLED"].map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={contractFilter === f ? "primary" : "ghost"}
                  onClick={() => setContractFilter(f)}
                >
                  {f === "ALL" ? "Tous" : f === "ACTIVE" ? "Actifs" : f === "PAID" ? "Payés" : "Annulés"}
                </Button>
              ))}
            </div>
          }
        >
          <DataList
            items={[...filteredContracts].sort(
              (a, b) => (b.createdAt || b.id) - (a.createdAt || a.id)
            )}
            getKey={(c) => c.id}
            maxHeight="max-h-[300px]"
            empty={<EmptyState title="Aucun contrat trouvé" size="sm" />}
            renderRow={(c) => (
              <div className="flex justify-between items-center px-4 py-3 hover:bg-surface-hover">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg ${
                      c.creditorId === user.id
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {c.creditorId === user.id ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-ink truncate">
                      {c.creditorId === user.id
                        ? `Prêt à ${c.debtorName}`
                        : `Emprunt de ${c.creditorName}`}
                    </div>
                    <DateTag timestamp={c.createdAt} format="date" />
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={c.status} />
                  <MoneyAmount value={c.totalAmount || 0} short size="sm" />
                </div>
              </div>
            )}
          />
        </Section>
      )}
    </div>
  );

  // ─── ONGLET : HISTORIQUE ────────────────────────────────────────────
  const historyTab = (
    <Section
      title="Grand Livre des Comptes"
      icon={Scroll}
      padded={false}
      actions={
        <div className="text-[10px] text-ink-mute text-numeric">
          {filteredTransactions.length} transaction
          {filteredTransactions.length !== 1 ? "s" : ""}
        </div>
      }
    >
      <div className="p-4 border-b border-hairline bg-surface-2/50">
        <Toolbar>
          <SearchField
            value={historySearch}
            onChange={setHistorySearch}
            placeholder="Rechercher par nom, motif…"
            className="flex-1"
          />
          <div className="flex gap-1 flex-wrap">
            {[
              { key: "ALL", label: "Tous" },
              { key: "IN", label: "Reçus" },
              { key: "OUT", label: "Envoyés" },
              { key: "TRANSFER", label: "Virements" },
              { key: "SALARY", label: "Salaires" },
              { key: "DEBT_PAYMENT", label: "Dettes" },
            ].map((f) => (
              <Button
                key={f.key}
                size="sm"
                variant={historyFilter === f.key ? "primary" : "secondary"}
                onClick={() => setHistoryFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </Toolbar>
      </div>

      <DataList
        items={displayedTransactions}
        getKey={(tx) => tx.id}
        maxHeight="max-h-[600px]"
        empty={
          <EmptyState
            icon={Filter}
            title="Aucune transaction trouvée"
            description="Modifiez vos filtres de recherche"
          />
        }
        renderRow={(tx) => {
          const isIncoming = tx.toName === user.name;
          return (
            <div className="flex justify-between items-center px-4 py-3 hover:bg-surface-hover">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isIncoming
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {isIncoming ? (
                    <ArrowDownLeft size={16} />
                  ) : (
                    <ArrowUpRight size={16} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-ink text-sm truncate">
                    {isIncoming
                      ? `Reçu de ${tx.fromName}`
                      : `Envoyé à ${tx.toName}`}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {tx.type && (
                      <span
                        className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                          TRANSACTION_COLORS[tx.type] ||
                          "bg-stone-50 text-stone-500 border-stone-100"
                        }`}
                      >
                        {TRANSACTION_LABELS[tx.type] || tx.type}
                      </span>
                    )}
                    {tx.reason && (
                      <span className="text-[10px] text-ink-mute italic truncate max-w-[200px]">
                        {tx.reason}
                      </span>
                    )}
                  </div>
                  <DateTag timestamp={tx.timestamp} format="long" />
                </div>
              </div>
              <MoneyAmount
                value={tx.amount}
                signed={isIncoming ? "+" : "−"}
                tone={isIncoming ? "positive" : "negative"}
                size="lg"
                className="ml-4"
              />
            </div>
          );
        }}
      />

      {!showAllHistory && filteredTransactions.length > 20 && (
        <div className="p-4 text-center border-t border-hairline">
          <Button
            variant="link"
            icon={ChevronDown}
            size="sm"
            onClick={() => setShowAllHistory(true)}
          >
            Afficher les {filteredTransactions.length - 20} transactions restantes
          </Button>
        </div>
      )}
    </Section>
  );

  return (
    <PageContainer>
      <PageHeader
        icon={Landmark}
        title="Banque Impériale"
        subtitle="Gérez vos avoirs, transferts et contrats"
      />
      {hero}
      {stats}
      {activeTab === "operations" && operationsTab}
      {activeTab === "loans" && loansTab}
      {activeTab === "history" && historyTab}
      {confirmDialog}
    </PageContainer>
  );
};

export default CitizenBankView;
