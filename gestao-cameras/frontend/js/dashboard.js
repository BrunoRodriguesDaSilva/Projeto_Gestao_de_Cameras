<div class="pt-4 flex flex-col sm:flex-row sm:items-center gap-6">
    <button onclick="abrirModal()" class="bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-600/10 flex items-center gap-2 whitespace-nowrap">
        ➕ Adicionar Nova Câmera
    </button>
    
    <div class="grid grid-cols-2 sm:flex gap-4 text-xs tracking-wide">
        <div class="bg-slate-900/60 border border-slate-700/50 px-3 py-2 rounded-xl min-w-[90px]">
            <p class="text-slate-400">Total</p>
            <p id="numTotal" class="text-lg font-bold text-white">0</p>
        </div>
        <div class="bg-slate-900/60 border border-slate-700/50 px-3 py-2 rounded-xl min-w-[90px]">
            <p class="text-emerald-400">Ativas</p>
            <p id="numAtivas" class="text-lg font-bold text-emerald-400">0</p>
        </div>
        <div class="bg-slate-900/60 border border-slate-700/50 px-3 py-2 rounded-xl min-w-[90px]">
            <p class="text-rose-400">Inativas</p>
            <p id="numInativas" class="text-lg font-bold text-rose-400">0</p>
        </div>
        <div class="bg-slate-900/60 border border-slate-700/50 px-3 py-2 rounded-xl min-w-[90px]">
            <p class="text-amber-400">Manutenção</p>
            <p id="numManutencao" class="text-lg font-bold text-amber-400">0</p>
        </div>
    </div>
</div>