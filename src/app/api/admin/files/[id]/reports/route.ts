import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStaff } from "@/lib/auth";

/** Dismiss all reports on a file (staff reviewed it, no action needed). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.fileReport.deleteMany({ where: { sharedFileId: id } });

  return NextResponse.json({ ok: true });
}
