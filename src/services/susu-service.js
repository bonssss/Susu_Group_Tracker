import { SusuError, SusuGroup } from "../domain/susu-group.js";
import { formatMoney, parseMoney } from "../utils/money.js";

export class SusuService {
  #group = null;

  createGroup(weeklyContributionInput) {
    if (this.#group) {
      throw new SusuError("A group already exists in this process.", 409);
    }

    const weeklyContributionPesewas = parseMoney(weeklyContributionInput);
    this.#group = new SusuGroup(weeklyContributionPesewas);

    return {
      weeklyContribution: formatMoney(this.#group.weeklyContributionPesewas),
    };
  }

  addMember(name) {
    const group = this.#requireGroup();
    const member = group.addMember(name);
    return { member };
  }

  recordContribution(member, amountInput) {
    const group = this.#requireGroup();
    const amountPesewas = parseMoney(amountInput);
    const result = group.recordContribution(member, amountPesewas);

    return {
      week: group.getReport().currentWeek,
      member: result.member,
      paid: formatMoney(result.paidPesewas),
      owes: formatMoney(group.weeklyContributionPesewas - result.paidPesewas),
    };
  }

  closeWeek() {
    const group = this.#requireGroup();
    const result = group.closeWeek();

    if (!result.closed) {
      return {
        closed: false,
        week: result.week,
        owes: result.owes.map(({ member, amountPesewas }) => ({
          member,
          amount: formatMoney(amountPesewas),
        })),
      };
    }

    return {
      closed: true,
      week: result.week,
      payout: {
        recipient: result.recipient,
        amount: formatMoney(result.amountPesewas),
      },
      currentWeek: group.getReport().currentWeek,
    };
  }

  getReport() {
    const group = this.#requireGroup();
    const report = group.getReport();

    return {
      currentWeek: report.currentWeek,
      weeklyContribution: formatMoney(report.weeklyContributionPesewas),
      members: report.members.map((member) => ({
        name: member.name,
        paidInFull: member.paidInFull,
        paid: formatMoney(member.paidPesewas),
        owes: formatMoney(member.owesPesewas),
      })),
      payoutHistory: report.payoutHistory.map((payout) => ({
        week: payout.week,
        recipient: payout.recipient,
        amount: formatMoney(payout.amountPesewas),
      })),
    };
  }

  #requireGroup() {
    if (!this.#group) {
      throw new SusuError("Create a group before using this endpoint.", 404);
    }
    return this.#group;
  }
}

export function createSusuService() {
  return new SusuService();
}
