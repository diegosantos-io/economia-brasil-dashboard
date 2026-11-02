package br.com.economiabr.api.service;

import br.com.economiabr.api.client.BancoCentralClient;
import br.com.economiabr.api.dto.CambioResponse;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CambioServiceTest {

    @Mock
    private BancoCentralClient bancoCentralClient;

    @InjectMocks
    private CambioService cambioService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void deveCombinarCotacoesDeCompraEVendaPelaMesmaData() throws Exception {

        String vendaJson = """
                [
                {
                    "data": "30/10/2026",
                    "valor": "5.4212"
                }
                ]
                """;

        String compraJson = """
                [
                {
                    "data": "30/10/2026",
                    "valor": "5.4206"
                }
                ]
                """;

        JsonNode venda = objectMapper.readTree(vendaJson);
        JsonNode compra = objectMapper.readTree(compraJson);

        when(bancoCentralClient.buscarCambio(30)).thenReturn(venda);
        when(bancoCentralClient.buscarCambioCompra(30)).thenReturn(compra);

        List<CambioResponse> resultado = cambioService.buscarHistorico(30);

        assertEquals(1, resultado.size());

        CambioResponse cambio = resultado.get(0);

        assertEquals("30/10/2026", cambio.data());
        assertEquals(5.4206, cambio.compra());
        assertEquals(5.4212, cambio.venda());
        assertEquals("USD/BRL", cambio.moeda());
        assertEquals("Banco Central do Brasil", cambio.fonte());

        verify(bancoCentralClient, times(1)).buscarCambio(30);
        verify(bancoCentralClient, times(1)).buscarCambioCompra(30);
    }

    @Test
    void deveOrdenarHistoricoDoMaisRecenteParaOMaisAntigo() throws Exception {

        String vendaJson = """
                [
                {
                    "data": "29/10/2026",
                    "valor": "5.3744"
                },
                {
                    "data": "30/10/2026",
                    "valor": "5.4212"
                }
                ]
                """;

        String compraJson = """
                [
                {
                    "data": "29/10/2026",
                    "valor": "5.3738"
                },
                {
                    "data": "30/10/2026",
                    "valor": "5.4206"
                }
                ]
                """;

        when(bancoCentralClient.buscarCambio(30))
                .thenReturn(objectMapper.readTree(vendaJson));

        when(bancoCentralClient.buscarCambioCompra(30))
                .thenReturn(objectMapper.readTree(compraJson));

        List<CambioResponse> resultado = cambioService.buscarHistorico(30);

        assertEquals(2, resultado.size());

        assertEquals("30/10/2026", resultado.get(0).data());
        assertEquals("29/10/2026", resultado.get(1).data());
    }
    @Test
    void deveIgnorarDatasSemCotacaoCorrespondente() throws Exception {

        String vendaJson = """
                [
                {
                    "data": "30/10/2026",
                    "valor": "5.4212"
                },
                {
                    "data": "29/10/2026",
                    "valor": "5.3744"
                }
                ]
                """;

        String compraJson = """
                [
                {
                    "data": "30/10/2026",
                    "valor": "5.4206"
                }
                ]
                """;

        when(bancoCentralClient.buscarCambio(30))
                .thenReturn(objectMapper.readTree(vendaJson));

        when(bancoCentralClient.buscarCambioCompra(30))
                .thenReturn(objectMapper.readTree(compraJson));

        List<CambioResponse> resultado = cambioService.buscarHistorico(30);

        assertEquals(1, resultado.size());
        assertEquals("30/10/2026", resultado.get(0).data());
    }
    
    @Test
    void deveLancarExcecaoQuandoRespostaDoBancoCentralForInvalida() {

        when(bancoCentralClient.buscarCambio(30)).thenReturn(null);
        when(bancoCentralClient.buscarCambioCompra(30)).thenReturn(null);

        assertThrows(
                IllegalStateException.class,
                () -> cambioService.buscarHistorico(30)
        );
    }
}