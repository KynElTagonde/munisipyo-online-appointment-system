import React, { useState } from 'react';
import { PHP_PROJECT_FILES, SourceFile } from '../data/sourceCodeFiles';
import JSZip from 'jszip';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Database, 
  Server, 
  Terminal, 
  CheckCircle2, 
  BookOpen,
  FolderTree,
  ExternalLink
} from 'lucide-react';

export const SourceCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<SourceFile>(PHP_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Add all PHP files to zip
      PHP_PROJECT_FILES.forEach(file => {
        zip.file(file.path, file.content);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'munisipyo_online_appointment_system_php.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate zip archive:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Overview & 1-Click ZIP Download Banner */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <FileCode className="w-3.5 h-3.5" />
              Complete PHP (PDO) & MySQL Source Package
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Municipal Appointment System Codebase
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Every deliverable requested is generated with clean PDO prepared statements, automated slot limit checks, reference code generator, public track status checker, and admin printable master list.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isZipping ? 'Archiving Package...' : 'Download Full Project (.ZIP)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Code Inspector: Left File Tree + Right Syntax Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: File Tree & Project Structure */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <FolderTree className="w-4 h-4 text-blue-700" />
              <span>Project Files & Structure</span>
            </div>

            <div className="space-y-1">
              {PHP_PROJECT_FILES.map(file => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {file.name.endsWith('.sql') ? (
                        <Database className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : file.name.endsWith('.php') ? (
                        <FileCode className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : (
                        <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                      <span className="truncate">{file.path}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {file.language}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Deployment Guide Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>XAMPP / WAMP Setup (3 Steps)</span>
            </div>

            <ol className="text-xs text-slate-600 space-y-2.5 list-decimal list-inside">
              <li>
                <strong className="text-slate-800">Extract files:</strong> Copy files into <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">C:/xampp/htdocs/munisipyo/</code>
              </li>
              <li>
                <strong className="text-slate-800">Import SQL:</strong> Open phpMyAdmin, import <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">database.sql</code> into <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">munisipyo_db</code>
              </li>
              <li>
                <strong className="text-slate-800">Run system:</strong> Navigate to <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">http://localhost/munisipyo/</code>
              </li>
            </ol>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
              <strong className="text-slate-700 block mb-0.5">Admin Login:</strong>
              Username: <code className="text-blue-800 font-bold">admin</code> &bull; Password: <code className="text-blue-800 font-bold">admin123</code>
            </div>
          </div>
        </div>

        {/* Right Column: Code Viewer with Copy Button */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            
            {/* File Info Bar */}
            <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span className="font-mono font-bold text-white">{selectedFile.path}</span>
                <span className="text-slate-500 hidden sm:inline">&bull; {selectedFile.description}</span>
              </div>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Body */}
            <div className="p-4 sm:p-6 overflow-x-auto max-h-[600px] overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed">
              <pre className="whitespace-pre">{selectedFile.content}</pre>
            </div>

            {/* Bottom Status */}
            <div className="bg-slate-950/80 px-5 py-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Encoding: UTF-8 &bull; Strict 2-Table Schema</span>
              <span>{selectedFile.language.toUpperCase()}</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
