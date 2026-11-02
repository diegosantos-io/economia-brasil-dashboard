package br.com.economiabr.api.controller;

import br.com.economiabr.api.dto.IpcaResponse;
import br.com.economiabr.api.service.IpcaService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.CrossOrigin;

import br.com.economiabr.api.service.SelicService;
import br.com.economiabr.api.dto.SelicResponse;

import br.com.economiabr.api.dto.PibResponse;
import br.com.economiabr.api.service.PibService;

import br.com.economiabr.api.dto.CambioResponse;
import br.com.economiabr.api.service.CambioService;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/v1/indicadores")
public class IndicadorController {

    private final IpcaService ipcaService;
    private final SelicService selicService;
    private final PibService pibService;
    private final CambioService cambioService;

    public IndicadorController(
            IpcaService ipcaService,
            SelicService selicService,
            PibService pibService,
            CambioService cambioService
            
    ) {
        this.ipcaService = ipcaService;
        this.selicService = selicService;
        this.pibService = pibService;
        this.cambioService = cambioService;
    }

    @GetMapping
    public List<Map<String, String>> listarIndicadores() {

        return List.of(
            Map.of("codigo", "IPCA", "nome", "Inflação", "fonte", "IBGE"),
            Map.of("codigo", "SELIC", "nome", "Taxa Selic", "fonte", "Banco Central"),
            Map.of("codigo", "PIB", "nome", "Produto Interno Bruto", "fonte", "IBGE"),
            Map.of("codigo", "CAMBIO", "nome", "Dólar", "fonte", "Banco Central")
        );
    }

    @GetMapping("/ipca")
    public List<IpcaResponse> buscarIpca(
            @RequestParam(defaultValue = "24") int meses) {

        return ipcaService.buscarHistorico(meses);
    }

    @GetMapping("/selic")
    public List<SelicResponse> buscarSelic(
            @RequestParam(defaultValue = "30") int dias
    ) {
        return selicService.buscarHistorico(dias);
    }

    @GetMapping("/pib") 
    public List<PibResponse> buscarPib() {
        return pibService.buscarHistorico();
    }

    @GetMapping("/cambio")
    public List<CambioResponse> buscarCambio(
            @RequestParam(defaultValue = "30") int dias
    ) {
        return cambioService.buscarHistorico(dias);
    }
}
