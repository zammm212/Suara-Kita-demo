
document.addEventListener("DOMContentLoaded", function () {

// KONEKSI SUPABASE
const SUPABASE_URL = "https://kjhinqsfdtupcolcxgyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_Fa09ibvs0AtkLOeAtbWZWQ_xzcXtP4f";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// CEK SESSION SUPABASE
let isLoggedIn = false;

async function checkLogin() {
    const { data } = await supabaseClient.auth.getSession();
    isLoggedIn = !!data.session;
    return isLoggedIn;
}


// NAVIGASI
window.showPage = async function (pageId) {

    if (pageId === "dashboard") {
        const loggedIn = await checkLogin();

        if (!loggedIn) {
            pageId = "login";
        }
    }

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const target = document.getElementById(pageId);

    if (target) {
        target.classList.add("active");
    }

    closeMenu();
    window.scrollTo(0, 0);

    if (pageId === "dashboard") {
        await updateDashboard();
        await loadTrackAdminRequests();
    }

    if (pageId === "track") {
        await loadTrackLeaderboard();
        
    }
};


// MENU POJOK KANAN
window.toggleMenu = function () {
    document.getElementById("dropdownMenu")
        .classList.toggle("show");
};

window.closeMenu = function () {
    document.getElementById("dropdownMenu")
        .classList.remove("show");

    document.getElementById("settingsPanel")
        .classList.remove("show");
};

window.menuNavigate = function (pageId) {
    showPage(pageId);
};


// SETTING
window.toggleSettings = function () {
    document.getElementById("settingsPanel")
        .classList.toggle("show");
};


// TEMA
window.toggleTheme = function () {
    document.body.classList.toggle("dark");

    const dark = document.body.classList.contains("dark");

    localStorage.setItem("suaraTheme", dark ? "dark" : "light");

    document.getElementById("themeToggle").textContent =
        dark ? "Mode Terang" : "Mode Gelap";
};

if (localStorage.getItem("suaraTheme") === "dark") {
    document.body.classList.add("dark");
    document.getElementById("themeToggle").textContent = "Mode Terang";
}


// UKURAN TEKS
window.changeFontSize = function () {
    const value = document.getElementById("fontSetting").value;

    document.body.classList.toggle("large-text", value === "large");

    localStorage.setItem("suaraFont", value);
};

const savedFont = localStorage.getItem("suaraFont");

if (savedFont) {
    document.getElementById("fontSetting").value = savedFont;
    changeFontSize();
}


// KLIK DI LUAR MENU UNTUK MENUTUP
document.addEventListener("click", function (event) {
    const menu = document.querySelector(".menu-area");

    if (menu && !menu.contains(event.target)) {
        closeMenu();
    }
});


// DATA
function getData() {
    try {
        return JSON.parse(localStorage.getItem("suarasimpatig")) || [];
    } catch {
        return [];
    }
}

function saveData(data) {
    localStorage.setItem("suarasimpatig", JSON.stringify(data));
}

function generateCode() {
    return "SK-" + Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();
}


// FORM ASPIRASI
document.getElementById("aspirasiForm")
    .addEventListener("submit", async function (event) {

    event.preventDefault();

    const kode = generateCode();

    const dataAspirasi = {
        kode: kode,
        nama: document.getElementById("nama").value || null,
        kelas: document.getElementById("kelas").value || null,
        kategori: document.getElementById("kategori").value,
        pesan: document.getElementById("pesan").value,
        saran: document.getElementById("saran").value || null
    };

    const { error } = await supabaseClient
        .from("aspirasi")
        .insert([dataAspirasi]);

    if (error) {
        console.error(error);
        alert("Aspirasi gagal dikirim. Coba lagi.");
        return;
    }

    alert("Aspirasi berhasil dikirim!\nKode: " + kode);

    this.reset();
    showPage("lacak");

    document.getElementById("kodeLacak").value = kode;
});


// FORM EKSPRESI SEMENTARA DINONAKTIFKAN
const ekspresiForm = document.getElementById("ekspresiForm");

if (ekspresiForm) {
    ekspresiForm.addEventListener("submit", function (event) {
        event.preventDefault();
    });
}


// LACAK PESAN SUPABASE
document.getElementById("lacakForm")
.addEventListener("submit", async function(event) {
    event.preventDefault();

    const kode = document.getElementById("kodeLacak")
        .value.trim().toUpperCase();

    const tempatHasil = document.getElementById("hasilLacak");
    tempatHasil.textContent = "Memeriksa pesan...";

    const { data, error } = await supabaseClient
        .rpc("lacak_aspirasi", { p_kode: kode });

    tempatHasil.replaceChildren();

    if (error) {
        console.error(error);
        tempatHasil.textContent = "Gagal memeriksa pesan.";
        return;
    }

    if (!data || data.length === 0) {
        tempatHasil.textContent = "Kode pesan tidak ditemukan.";
        return;
    }

    const hasilData = data[0];

    [
        "Pesan ditemukan",
        "Kategori: " + hasilData.kategori,
        "Status: " + hasilData.status,
        "Tanggal: " + new Date(hasilData.created_at)
            .toLocaleString("id-ID"),
        "Kode: " + hasilData.kode
    ].forEach(teks => {
        const p = document.createElement("p");
        p.textContent = teks;
        tempatHasil.appendChild(p);
    });

    const judulBalasan = document.createElement("h3");
    judulBalasan.textContent = "Riwayat Balasan OSIS";
    tempatHasil.appendChild(judulBalasan);

    if (!hasilData.balasan || hasilData.balasan.length === 0) {
        const kosong = document.createElement("p");
        kosong.textContent = "Belum ada balasan dari OSIS.";
        tempatHasil.appendChild(kosong);
    } else {
        hasilData.balasan.forEach(item => {
            const card = document.createElement("div");
            card.className = "message-card";

            const pengirim = document.createElement("p");
            pengirim.textContent = "Pengirim: " + item.pengirim;

            const pesan = document.createElement("p");
            pesan.textContent = item.pesan;

            const tanggal = document.createElement("p");
            tanggal.textContent =
                new Date(item.created_at).toLocaleString("id-ID");

            card.append(pengirim, pesan, tanggal);
            tempatHasil.appendChild(card);
        });
    }
});


// LOGIN SUPABASE
document.getElementById("loginForm")
    .addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const error = document.getElementById("loginError");

    error.textContent = "Sedang masuk...";

    const { data, error: loginError } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (loginError) {
        error.textContent = "Email atau password salah.";
        return;
    }

    isLoggedIn = true;

    sessionStorage.setItem(
        "adminName",
        data.user.email
    );

    error.textContent = "";
    this.reset();

    showPage("dashboard");
});


// KELUAR DASHBOARD TANPA LOGOUT
window.closeDashboard = function () {
    if (sessionStorage.getItem("osisLogin") === "true") {
        showPage("beranda");
    } else {
        showPage("login");
    }
};


// LOGOUT SUPABASE
window.logout = async function () {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Gagal logout.");
        return;
    }

    isLoggedIn = false;
    sessionStorage.removeItem("adminName");

    showPage("home");
    alert("Berhasil logout.");
};

  // RESET TRACK FLOWS AREA
window.resetTrackPeriod = async function() {
    const codeInput = document.getElementById("trackResetCode");
    const status = document.getElementById("trackResetStatus");

    const code = codeInput.value.trim();

    if (!code) {
        status.textContent = "Masukkan kode khusus OSIS.";
        return;
    }

    if (!confirm("Yakin reset leaderboard dan memulai periode baru?")) {
        return;
    }

    status.textContent = "Memproses reset...";

    const { error } = await supabaseClient.rpc(
        "reset_track_period",
        {
            input_code: code
        }
    );

    if (error) {
        console.error(error);
        status.textContent = "Reset gagal. Periksa kode atau akses OSIS.";
        return;
    }

    codeInput.value = "";
    status.textContent = "Leaderboard berhasil direset.";

    await loadTrackAdminRequests();
    await loadTrackLeaderboard();
};

// DASHBOARD SUPABASE
window.updateDashboard = async function () {

    const loggedIn = await checkLogin();

    if (!loggedIn) {
        showPage("login");
        return;
    }

    const { data, error } = await supabaseClient
        .from("aspirasi")
        .select("*");

    if (error) {
        console.error(error);
        alert("Gagal mengambil data aspirasi.");
        return;
    }

    document.getElementById("adminName").textContent =
        sessionStorage.getItem("adminName") || "Admin";

    document.getElementById("totalPesan").textContent = data.length;

    document.getElementById("totalAspirasi").textContent = data.length;

    document.getElementById("totalEkspresi").textContent = 0;

    renderMessages(data);
};

// SIMPAN KODE RESET
window.setTrackResetCode = async function() {
    const code = "OSIS2627";

    const { error } = await supabaseClient.rpc(
        "set_track_reset_code",
        { input_code: code }
    );

    if (error) {
        console.error(error);
        alert("Gagal menyimpan kode reset.");
        return;
    }

    alert("Kode reset berhasil disimpan.");
};
  
// PESAN MASUK SUPABASE
window.renderMessages = function (data = []) {

    const container = document.getElementById("messageList");

    container.replaceChildren();

    if (data.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-message";
        empty.textContent = "Belum ada pesan masuk.";
        container.appendChild(empty);
        return;
    }

    data.forEach(item => {

        const card = document.createElement("div");
        card.className = "message-card";

        const title = document.createElement("h3");
        title.textContent = "Aspirasi Sekolah";

        const code = document.createElement("p");
        code.textContent = "Kode: " + item.kode;

        const date = document.createElement("p");
        date.textContent = "Tanggal: " +
            new Date(item.created_at).toLocaleString("id-ID");

        const status = document.createElement("p");
        status.textContent = "Status: " + item.status;

        const detail = document.createElement("p");
        detail.textContent =
            "Nama: " + (item.nama || "Anonim") +
            " | Kelas: " + (item.kelas || "Tidak dicantumkan") +
            " | Kategori: " + item.kategori;

        const message = document.createElement("p");
        message.className = "message-content";
        message.textContent = item.pesan;

        card.append(title, code, date, status, detail, message);

        if (item.saran) {
            const suggestion = document.createElement("p");
            suggestion.textContent = "Saran: " + item.saran;
            card.appendChild(suggestion);
        }

        const actions = document.createElement("div");
        actions.className = "message-actions";

        // PILIH STATUS
        const statusSelect = document.createElement("select");

        [
            "Menunggu pemeriksaan",
            "Sedang ditinjau",
            "Dalam pembahasan",
            "Menunggu keputusan sekolah",
            "Sudah dibalas",
            "Selesai",
            "Ditolak"
        ].forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            option.selected = item.status === value;
            statusSelect.appendChild(option);
        });

        // SIMPAN STATUS
        const updateButton = document.createElement("button");
        updateButton.textContent = "Simpan Status";

        updateButton.addEventListener("click", async function () {

            updateButton.disabled = true;

            const { error } = await supabaseClient
                .from("aspirasi")
                .update({ status: statusSelect.value })
                .eq("kode", item.kode);

            if (error) {
                console.error(error);
                alert("Gagal memperbarui status.");
            } else {
                alert("Status berhasil diperbarui.");
                await updateDashboard();
            }

            updateButton.disabled = false;
        });

        // BERI BALASAN
        const replyButton = document.createElement("button");
        replyButton.textContent = "Beri Balasan";

        replyButton.addEventListener("click", async function () {

            const reply = prompt("Tulis balasan untuk aspirasi ini:");

            if (reply === null || !reply.trim()) return;

            const { data: userData } =
                await supabaseClient.auth.getUser();

            const { error } = await supabaseClient
                .from("balasan")
                .insert([{
                    kode_aspirasi: item.kode,
                    pengirim: userData.user.email,
                    pesan: reply.trim()
                }]);

            if (error) {
                console.error(error);
                alert("Balasan gagal dikirim.");
                return;
            }

            const { error: updateError } = await supabaseClient
                .from("aspirasi")
                .update({ status: "Sudah dibalas" })
                .eq("kode", item.kode);

            if (updateError) {
                console.error(updateError);
                alert("Balasan terkirim, tapi status gagal diperbarui.");
                return;
            }

            alert("Balasan berhasil dikirim!");
            await updateDashboard();
        });

        // HAPUS ASPIRASI
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Hapus Aspirasi";

        deleteButton.addEventListener("click", async function () {

            const yakin = confirm(
                "Yakin ingin menghapus aspirasi ini? Riwayat balasannya juga akan dihapus."
            );

            if (!yakin) return;

            const { error: replyError } = await supabaseClient
                .from("balasan")
                .delete()
                .eq("kode_aspirasi", item.kode);

            if (replyError) {
                console.error(replyError);
                alert("Gagal menghapus riwayat balasan.");
                return;
            }

            const { error } = await supabaseClient
                .from("aspirasi")
                .delete()
                .eq("kode", item.kode);

            if (error) {
                console.error(error);
                alert("Gagal menghapus aspirasi.");
                return;
            }

            alert("Aspirasi berhasil dihapus.");
            await updateDashboard();
        });

        actions.append(
            statusSelect,
            updateButton,
            replyButton,
            deleteButton
        );

        card.appendChild(actions);
        container.appendChild(card);
    });
};


// TRACK FLOWS AREA

// FORM REQUEST LAGU
const trackForm = document.getElementById("trackRequestForm");

if (trackForm) {
    trackForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const status = document.getElementById("trackRequestStatus");
        const spotifyUrl = document.getElementById("trackSpotify").value.trim();

        if (
            spotifyUrl &&
            !/^https:\/\/open\.spotify\.com\/(track|intl-[a-z]{2}\/track)\/[a-zA-Z0-9]+/i.test(spotifyUrl)
        ) {
            status.textContent = "Link Spotify tidak valid.";
            return;
        }

        status.textContent = "Mengirim request...";

        const { data, error } = await supabaseClient.rpc(
    "submit_track_request",
    {
        input_title: document.getElementById("trackTitle").value.trim(),
        input_artist: document.getElementById("trackArtist").value.trim(),
        input_play_date: new Date().toLocaleDateString("en-CA"),
        input_requester_name: document.getElementById("trackRequester").value.trim(),
        input_requester_class: document.getElementById("trackClass").value.trim(),
        input_spotify_url: spotifyUrl || null
    }
);

        if (error) {
            console.error(error);
            status.textContent = error.message;
            return;
        }

        status.textContent = "Request berhasil dikirim!";
        this.reset();

        await loadTrackLeaderboard();
        
    });
}


// LEADERBOARD TOP 12
async function loadTrackLeaderboard() {
    const container = document.getElementById("trackLeaderboard");
    if (!container) return;

    container.textContent = "Memuat leaderboard...";

    const { data, error } = await supabaseClient.rpc("get_track_leaderboard");

    container.replaceChildren();

    if (error) {
        console.error(error);
        container.textContent = "Gagal memuat leaderboard.";
        return;
    }

    if (!data || data.length === 0) {
        container.textContent = "Belum ada request lagu.";
        return;
    }

    data.forEach((song, index) => {
        const card = document.createElement("div");
        card.className = "message-card";

        const title = document.createElement("h3");
        title.textContent = `${index + 1}. ${song.title}`;

        const artist = document.createElement("p");
        artist.textContent = "Artis: " + song.artist;

        const total = document.createElement("p");
        total.textContent = "Total request: " + song.total_requests;

        card.append(title, artist, total);
        container.appendChild(card);
    });
}
  // JADWAL PEMUTARANl

// REQUEST LAGU DASHBOARD OSIS
window.loadTrackAdminRequests = async function() {
    const container = document.getElementById("trackRequestAdminList");
    const periodLabel = document.getElementById("trackAdminPeriod");

    if (!container) return;

    container.textContent = "Memuat request lagu...";

    const { data: period, error: periodError } = await supabaseClient
        .from("track_periods")
        .select("id, started_at")
        .is("ended_at", null)
        .maybeSingle();

    if (periodError || !period) {
        console.error(periodError);
        container.textContent = "Periode aktif tidak ditemukan.";
        if (periodLabel) periodLabel.textContent = "Tidak ada periode aktif";
        return;
    }

    if (periodLabel) {
        periodLabel.textContent = "Dimulai: " +
            new Date(period.started_at).toLocaleDateString("id-ID");
    }

    const { data, error } = await supabaseClient.rpc(
        "get_track_requests",
        { input_period_id: period.id }
    );

    container.replaceChildren();

    if (error) {
        console.error(error);
        container.textContent = "Gagal memuat request lagu.";
        return;
    }

    if (!data || data.length === 0) {
        container.textContent = "Belum ada request lagu.";
        return;
    }

    data.forEach(request => {
        const card = document.createElement("div");
        card.className = "message-card";

        const title = document.createElement("h3");
        title.textContent = request.title;

        const artist = document.createElement("p");
        artist.textContent = "Artis: " + request.artist;

        const requester = document.createElement("p");
        requester.textContent = "Peminta: " +
            request.requester_name + " (" +
            request.requester_class + ")";

        const date = document.createElement("p");
        date.textContent = "Tanggal pemutaran: " +
            new Date(request.play_date + "T00:00:00")
                .toLocaleDateString("id-ID");

        const created = document.createElement("p");
        created.textContent = "Dikirim: " +
            new Date(request.created_at).toLocaleString("id-ID");

        const status = document.createElement("p");
        status.textContent = "Status: " + request.status;
      
status.className = "track-request-status";

if (request.status === "disetujui") {
    status.classList.add("approved");
} else if (request.status === "ditolak") {
    status.classList.add("rejected");
} else {
    status.classList.add("pending");
}
        card.append(title, artist, requester, date, created, status);

        if (request.status === "menunggu") {
            const actions = document.createElement("div");
            actions.style.display = "flex";
            actions.style.gap = "10px";
            actions.style.marginTop = "15px";

            const approveButton = document.createElement("button");
            approveButton.type = "button";
            approveButton.className = "primary";
            approveButton.textContent = "Setujui";

            const rejectButton = document.createElement("button");
            rejectButton.type = "button";
            rejectButton.className = "secondary";
            rejectButton.textContent = "Tolak";

            approveButton.addEventListener("click", async function() {
                approveButton.disabled = true;
                rejectButton.disabled = true;

                const { data, error } = await supabaseClient.rpc(
                    "update_track_request_status",
                    {
                        input_request_id: request.request_id,
                        input_status: "disetujui"
                    }
                );

                if (error || !data) {
                    console.error(error);
                    alert("Gagal menyetujui request.");
                    approveButton.disabled = false;
                    rejectButton.disabled = false;
                    return;
                }

                alert("Request berhasil disetujui dan masuk jadwal.");

                await loadTrackAdminRequests();
                
            });

            rejectButton.addEventListener("click", async function() {
                if (!confirm("Yakin ingin menolak request ini?")) return;

                approveButton.disabled = true;
                rejectButton.disabled = true;

                const { data, error } = await supabaseClient.rpc(
                    "update_track_request_status",
                    {
                        input_request_id: request.request_id,
                        input_status: "ditolak"
                    }
                );

                if (error || !data) {
                    console.error(error);
                    alert("Gagal menolak request.");
                    approveButton.disabled = false;
                    rejectButton.disabled = false;
                    return;
                }

                alert("Request berhasil ditolak.");

                await loadTrackAdminRequests();
            });

            actions.append(approveButton, rejectButton);
            card.appendChild(actions);
        }

        container.appendChild(card);
    });
};

// PULIHKAN SESSION LOGIN SAAT WEB DIBUKA KEMBALI
checkLogin().then(loggedIn => {
    if (loggedIn) {
        updateDashboard();
    }
});

});
