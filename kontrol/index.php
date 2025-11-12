<?php
    $penjemuran = isset($_GET['penjemuran']) && $_GET['penjemuran']=="on";
    $penutup = isset($_GET['penutup']) && $_GET['penutup']=="on";
    $ventilator = isset($_GET['ventilator']) && $_GET['ventilator']=="on";
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>SmartDry Agro - Kontrol Manual</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <!-- HEADER -->
    <header class="header">
        <div class="left-header">
            <img src="logo.png" class="logo-img">
            <div class="brand-text">SmartDry Agro</div>
        </div>

        <nav class="menu">
            <a href="#">Dashboard</a>
            <a href="#">Notifikasi</a>
            <a class="active" href="index.php">Kontrol</a>
        </nav>
    </header>

    <!-- MAIN -->
    <main class="main-container">

        <h1 class="page-title">Kontrol Manual</h1>

        <div class="card">
            <form action="control.php" method="POST">

                <div class="control-item">
                    <span>🌤️ Penjemuran</span>
                    <label class="switch">
                        <input type="checkbox" name="penjemuran" <?= $penjemuran?"checked":"" ?>>
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="control-item">
                    <span>☁️ Penutup</span>
                    <label class="switch">
                        <input type="checkbox" name="penutup" <?= $penutup?"checked":"" ?>>
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="control-item">
                    <span>🌀 Ventilator</span>
                    <label class="switch">
                        <input type="checkbox" name="ventilator" <?= $ventilator?"checked":"" ?>>
                        <span class="slider"></span>
                    </label>
                </div>

                <button class="btn" type="submit">Simpan Pengaturan</button>

            </form>
        </div>

        <p class="footer">© SmartDry Agro</p>
    </main>

</body>
</html>
