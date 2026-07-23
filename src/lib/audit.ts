import { prisma } from "@/lib/prisma";
import { redactSensitive } from "@/lib/security";

type AuditInput = {
  actorType: "ADMIN" | "USER" | "SYSTEM";
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  outcome?: "SUCCESS" | "FAILURE";
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorType: input.actorType,
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        outcome: input.outcome ?? "SUCCESS",
        metadata: JSON.stringify(redactSensitive(input.metadata ?? {}))
      }
    });
  } catch (error) {
    console.error("Không thể ghi audit log", error);
  }
}
