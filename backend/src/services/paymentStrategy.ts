import { AppError } from "../utils/appError";

export type PaymentMethod = "nequi" | "pse" | "tarjeta";

type PaymentContext = {
  eventoId: number;
  total: number;
};

type PaymentResult = {
  reference: string;
  status: "approved";
  message: string;
};

export type PaymentPayload = Record<string, unknown>;

interface PaymentStrategy {
  pay(context: PaymentContext, payload: PaymentPayload): PaymentResult;
}

function onlyDigits(value: unknown) {
  return String(value || "").replace(/\D/g, "");
}

function requireText(value: unknown, message: string) {
  const text = String(value || "").trim();

  if (!text) {
    throw new AppError(message, {
      status: 400,
      code: "INVALID_PAYMENT_DATA",
    });
  }

  return text;
}

function buildReference(prefix: string, eventoId: number) {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${eventoId}-${Date.now()}-${suffix}`;
}

class NequiPaymentStrategy implements PaymentStrategy {
  pay(context: PaymentContext, payload: PaymentPayload): PaymentResult {
    const phone = onlyDigits(payload.phone);

    if (!/^3\d{9}$/.test(phone)) {
      throw new AppError("Ingresa un numero Nequi colombiano valido", {
        status: 400,
        code: "INVALID_NEQUI_PHONE",
        details: { phoneLength: phone.length },
      });
    }

    return {
      reference: buildReference("NEQ", context.eventoId),
      status: "approved",
      message: "Pago aprobado con Nequi",
    };
  }
}

class PsePaymentStrategy implements PaymentStrategy {
  pay(context: PaymentContext, payload: PaymentPayload): PaymentResult {
    requireText(payload.bank, "Selecciona el banco para pagar con PSE");
    requireText(payload.documentType, "Selecciona el tipo de documento");

    const documentNumber = onlyDigits(payload.documentNumber);

    if (documentNumber.length < 6) {
      throw new AppError("Ingresa un numero de documento valido", {
        status: 400,
        code: "INVALID_PSE_DOCUMENT",
        details: { documentLength: documentNumber.length },
      });
    }

    return {
      reference: buildReference("PSE", context.eventoId),
      status: "approved",
      message: "Pago aprobado con PSE",
    };
  }
}

class CardPaymentStrategy implements PaymentStrategy {
  pay(context: PaymentContext, payload: PaymentPayload): PaymentResult {
    const cardNumber = onlyDigits(payload.cardNumber);
    const expiry = requireText(payload.expiry, "Ingresa la fecha de vencimiento");
    const cvv = onlyDigits(payload.cvv);
    requireText(payload.holderName, "Ingresa el nombre del titular");
    requireText(payload.cardType, "Selecciona si la tarjeta es debito o credito");

    if (!/^(4|5)\d{15}$/.test(cardNumber)) {
      throw new AppError("Ingresa una tarjeta Visa o Mastercard valida", {
        status: 400,
        code: "INVALID_CARD_NUMBER",
        details: { cardLength: cardNumber.length },
      });
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      throw new AppError("La fecha de vencimiento debe tener formato MM/AA", {
        status: 400,
        code: "INVALID_CARD_EXPIRY",
      });
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      throw new AppError("Ingresa un codigo de seguridad valido", {
        status: 400,
        code: "INVALID_CARD_CVV",
        details: { cvvLength: cvv.length },
      });
    }

    return {
      reference: buildReference("CARD", context.eventoId),
      status: "approved",
      message: "Pago aprobado con tarjeta",
    };
  }
}

const strategies: Record<PaymentMethod, PaymentStrategy> = {
  nequi: new NequiPaymentStrategy(),
  pse: new PsePaymentStrategy(),
  tarjeta: new CardPaymentStrategy(),
};

export class PaymentStrategyFactory {
  static get(method: string): PaymentStrategy {
    const strategy = strategies[method as PaymentMethod];

    if (!strategy) {
      throw new AppError("Metodo de pago no soportado", {
        status: 400,
        code: "UNSUPPORTED_PAYMENT_METHOD",
        details: { method },
      });
    }

    return strategy;
  }
}
