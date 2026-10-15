export class SusuError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "SusuError";
    this.statusCode = statusCode;
  }
}

export class SusuGroup {
  constructor(weeklyContributionPesewas) {
    if (!Number.isSafeInteger(weeklyContributionPesewas) || weeklyContributionPesewas <= 0) {
      throw new SusuError("Weekly contribution must be a positive amount in pesewas.");
    }

    this.weeklyContributionPesewas = weeklyContributionPesewas;
    this.members = new Map();
    this.payments = new Map();
    this.payoutHistory = [];
    this.currentWeek = 1;
    this.hasStarted = false;
  }

  addMember(name) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new SusuError("Member name or ID must not be empty.");
    }

    const memberName = name.trim();
    const memberKey = memberName.toLocaleLowerCase();

    if (this.hasStarted) {
      throw new SusuError("Members cannot be added after contributions have started.");
    }
    if (this.members.has(memberKey)) {
      throw new SusuError(`Member "${memberName}" already exists.`, 409);
    }
    if (!Number.isSafeInteger((this.members.size + 1) * this.weeklyContributionPesewas)) {
      throw new SusuError("The group pot would exceed the supported money range.");
    }

    this.members.set(memberKey, memberName);
    return memberName;
  }

  recordContribution(name, amountPesewas) {
    const memberKey = this.#getMemberKey(name);
    if (!Number.isSafeInteger(amountPesewas) || amountPesewas <= 0) {
      throw new SusuError("Contribution must be a positive amount in pesewas.");
    }

    const alreadyPaid = this.payments.get(memberKey) ?? 0;
    const remaining = this.weeklyContributionPesewas - alreadyPaid;
    if (amountPesewas > remaining) {
      throw new SusuError(
        `Contribution exceeds the amount owed. Member owes ${remaining} pesewas.`,
      );
    }

    this.payments.set(memberKey, alreadyPaid + amountPesewas);
    this.hasStarted = true;
    return { member: this.members.get(memberKey), paidPesewas: this.payments.get(memberKey) };
  }

  closeWeek() {
    if (this.members.size === 0) {
      throw new SusuError("Add at least one member before closing a week.");
    }

    const owes = [...this.members].flatMap(([key, member]) => {
      const remaining = this.weeklyContributionPesewas - (this.payments.get(key) ?? 0);
      return remaining > 0 ? [{ member, amountPesewas: remaining }] : [];
    });

    if (owes.length > 0) {
      return { closed: false, week: this.currentWeek, owes };
    }

    const recipient = [...this.members.values()][this.payoutHistory.length % this.members.size];
    const amountPesewas = [...this.payments.values()].reduce((total, amount) => total + amount, 0);
    const payout = { week: this.currentWeek, recipient, amountPesewas };
    this.payoutHistory.push(payout);
    this.currentWeek += 1;
    this.payments.clear();

    return { closed: true, ...payout };
  }

  getReport() {
    return {
      currentWeek: this.currentWeek,
      weeklyContributionPesewas: this.weeklyContributionPesewas,
      members: [...this.members].map(([key, name]) => {
        const paidPesewas = this.payments.get(key) ?? 0;
        return {
          name,
          paidPesewas,
          owesPesewas: this.weeklyContributionPesewas - paidPesewas,
          paidInFull: paidPesewas === this.weeklyContributionPesewas,
        };
      }),
      payoutHistory: this.payoutHistory.map((payout) => ({ ...payout })),
    };
  }

  #getMemberKey(name) {
    if (typeof name !== "string" || !this.members.has(name.trim().toLocaleLowerCase())) {
      throw new SusuError(`Unknown member "${name}".`, 404);
    }
    return name.trim().toLocaleLowerCase();
  }
}
