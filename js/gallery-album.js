// Gerenciador de Galeria e Álbum de Atividades do Estudante (Gallery & Album)
class GalleryAlbum {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.storageKey = 'geolab3d_student_album';
    }

    getRecords() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Erro ao ler galeria do localStorage', e);
            return [];
        }
    }

    saveRecords(records) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(records));
        } catch (e) {
            console.error('Erro ao salvar galeria no localStorage', e);
        }
    }

    captureSnapshot(title, solidName, metrics, notes = '') {
        if (!this.sm || !this.sm.renderer) return null;

        // Força renderização para garantir captura limpa
        this.sm.renderer.render(this.sm.scene, this.sm.camera);
        const dataUrl = this.sm.renderer.domElement.toDataURL('image/png');

        const record = {
            id: 'proj_' + Date.now(),
            date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            title: title || 'Projeto Geométrico 3D',
            solidName: solidName || 'Sólido 3D',
            totalArea: metrics.totalArea || '-',
            volume: metrics.volume || '-',
            dimensions: metrics.dimensions || '-',
            notes: notes || 'Atividade de Geometria Espacial realizada no GeoLab 3D.',
            image: dataUrl
        };

        const records = this.getRecords();
        records.unshift(record);
        this.saveRecords(records);

        return record;
    }

    deleteRecord(id) {
        let records = this.getRecords();
        records = records.filter(r => r.id !== id);
        this.saveRecords(records);
        return records;
    }

    downloadImage(dataUrl, filename = 'geolab3d-projeto.png') {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    renderAlbumUI(containerElement, onRecordCountChange) {
        if (!containerElement) return;
        const records = this.getRecords();

        if (typeof onRecordCountChange === 'function') {
            onRecordCountChange(records.length);
        }

        containerElement.innerHTML = '';

        if (records.length === 0) {
            containerElement.innerHTML = `
                <div class="album-empty-state">
                    <div style="font-size:3.5rem; margin-bottom:12px;">📷</div>
                    <div style="font-size:1.15rem; font-weight:700; color:#fff;">Seu Álbum está vazio</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary); max-width:380px; margin:8px auto 20px; line-height:1.5;">
                        Você ainda não registrou nenhum projeto. Quando estiver manipulando um sólido, construindo um edifício ou resolvendo uma missão, clique no botão <b>📸 Fotografar Sólido</b>!
                    </div>
                </div>
            `;
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'album-grid';

        records.forEach(rec => {
            const card = document.createElement('div');
            card.className = 'album-card';
            card.innerHTML = `
                <div class="album-photo-box">
                    <img src="${rec.image}" alt="${rec.title}" class="album-img-preview" />
                    <span class="album-date-badge">${rec.date}</span>
                </div>
                <div class="album-card-body">
                    <div class="album-card-title">${rec.title}</div>
                    <div class="album-card-solid">${rec.solidName}</div>
                    
                    <div class="album-metrics-row">
                        <div class="album-metric-chip">
                            <span class="m-label">Área Total:</span>
                            <span class="m-val">${rec.totalArea}</span>
                        </div>
                        <div class="album-metric-chip">
                            <span class="m-label">Volume:</span>
                            <span class="m-val">${rec.volume}</span>
                        </div>
                    </div>

                    <div class="album-notes-text">${rec.notes}</div>

                    <div class="album-card-actions">
                        <button class="btn-album-action btn-download" data-id="${rec.id}">⬇️ Baixar Imagem</button>
                        <button class="btn-album-action btn-delete" data-id="${rec.id}">🗑️ Excluir</button>
                    </div>
                </div>
            `;

            // Eventos do card
            const btnDownload = card.querySelector('.btn-download');
            btnDownload.addEventListener('click', () => {
                this.downloadImage(rec.image, `geolab3d-${rec.title.toLowerCase().replace(/\s+/g, '-')}.png`);
                if (window.sounds) window.sounds.playSuccess();
            });

            const btnDelete = card.querySelector('.btn-delete');
            btnDelete.addEventListener('click', () => {
                if (confirm(`Deseja excluir a foto do projeto "${rec.title}" do seu álbum?`)) {
                    this.deleteRecord(rec.id);
                    this.renderAlbumUI(containerElement, onRecordCountChange);
                    if (window.sounds) window.sounds.playClick();
                }
            });

            grid.appendChild(card);
        });

        containerElement.appendChild(grid);
    }
}

window.GalleryAlbum = GalleryAlbum;
