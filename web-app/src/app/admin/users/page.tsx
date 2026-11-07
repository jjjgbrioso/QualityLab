import type { Metadata } from "next";
import { z } from "zod";
import { AdminNav } from "@/components/AdminNav";
import { Card, PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { requirePageAdmin } from "@/lib/auth/session";
import { parsePageQuery, type SearchParams } from "@/lib/page-helpers";
import { listUsers } from "@/lib/services/admin";
import { pageFields } from "@/lib/validation/common";

export const metadata: Metadata = { title: "Users" };

const querySchema = z.object(pageFields);

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePageAdmin("/admin/users");
  const { query } = parsePageQuery(await searchParams, querySchema);
  const { items, meta } = await listUsers(query);

  return (
    <>
      <PageHeader title="Users" testId="admin-users" />
      <AdminNav />
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm" data-testid="admin-users-table">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th scope="col" className="p-3 font-medium">Name</th>
              <th scope="col" className="p-3 font-medium">Email</th>
              <th scope="col" className="p-3 font-medium">Role</th>
              <th scope="col" className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((user) => (
              <tr key={user.id} className="border-b border-line last:border-0" data-testid={`admin-user-row-${user.id}`}>
                <td className="p-3">{user.firstName} {user.lastName}</td>
                <td className="p-3 text-muted">{user.email}</td>
                <td className="p-3"><StatusBadge status={user.role} /></td>
                <td className="p-3"><StatusBadge status={user.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Pagination meta={meta} basePath="/admin/users" query={{}} testId="admin-user-pagination" />
    </>
  );
}
