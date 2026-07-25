import { Card } from '../../../shared/components/Card';

export function AboutTab() {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Informasi Sistem</h2>
        <div className="grid gap-y-4 gap-x-8 md:grid-cols-2 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Versi Aplikasi</span>
            <span className="font-medium text-slate-900">v1.0.0-rc</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Framework Frontend</span>
            <span className="font-medium text-slate-900">React + Vite (TypeScript)</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Framework Backend</span>
            <span className="font-medium text-slate-900">NestJS (TypeScript)</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Database</span>
            <span className="font-medium text-slate-900">PostgreSQL (Prisma ORM)</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Cache Server</span>
            <span className="font-medium text-slate-900">Redis / In-Memory</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Environment</span>
            <span className="font-medium text-slate-900">Production</span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Status Layanan (Mock)</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-md border border-green-100">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-900">Database Connection</span>
            </div>
            <span className="text-sm text-green-700">Healthy</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-md border border-green-100">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-900">Redis Cache</span>
            </div>
            <span className="text-sm text-green-700">Healthy</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-md border border-green-100">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-900">Background Workers</span>
            </div>
            <span className="text-sm text-green-700">Healthy</span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Penggunaan Sumber Daya (Mock)</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">CPU Usage</span>
              <span className="font-medium text-slate-900">12%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '12%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Memory Usage (2.4 GB / 8 GB)</span>
              <span className="font-medium text-slate-900">30%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>
        </div>
      </Card>
      
      <div className="text-center text-xs text-slate-400 mt-8">
        &copy; {new Date().getFullYear()} POS Apotek. All rights reserved.
      </div>
    </div>
  );
}
